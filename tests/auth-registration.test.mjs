import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadAuth(search = '') {
  let source = await readFile(new URL('../auth.js', import.meta.url), 'utf8');
  source = source.replace(
    /\n\}\)\(\);\s*$/,
    '\n;globalThis.__SEA_AUTH_TEST__={persistJson,persistRegistration,normalizeEmail,isUsableAccount,registrationConflict,signinUrl,registerUrl,accountActionTarget,safeReturn};\n})();\n'
  );
  assert.match(source, /__SEA_AUTH_TEST__/, 'test hook injection failed');

  const values = new Map();
  const context = {
    console,
    URL,
    URLSearchParams,
    encodeURIComponent,
    localStorage: {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); }
    },
    document: {
      currentScript: null,
      addEventListener() {}
    },
    location: {
      pathname: '/register.html',
      search,
      hash: '',
      href: '',
      origin: 'https://sajjadengineeringacademy.com',
      replace() {}
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'auth.js' });
  return context.__SEA_AUTH_TEST__;
}

test('browser storage failures are reported without throwing', async () => {
  const { persistJson } = await loadAuth();
  let saved = '';

  assert.equal(persistJson({ setItem(key, value) { saved = `${key}:${value}`; } }, 'session', { email: 'learner@example.com' }), true);
  assert.equal(saved, 'session:{"email":"learner@example.com"}');
  assert.equal(persistJson({ setItem() { throw new Error('storage blocked'); } }, 'session', { email: 'learner@example.com' }), false);
});

test('registration storage rolls back both learner records after a partial failure', async () => {
  const { persistRegistration } = await loadAuth();
  const values = new Map([
    ['sea_account_v2', JSON.stringify({ email: 'existing@example.com', name: 'Existing learner' })],
    ['sea_session_v2', JSON.stringify({ email: 'existing@example.com' })]
  ]);
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if(key === 'sea_session_v2' && JSON.parse(value).email === 'new@example.com') throw new Error('storage full');
      values.set(key, String(value));
    },
    removeItem(key) { values.delete(key); }
  };

  assert.equal(persistRegistration(storage, { email: 'new@example.com' }, { email: 'new@example.com' }), false);
  assert.deepEqual(JSON.parse(values.get('sea_account_v2')), { email: 'existing@example.com', name: 'Existing learner' });
  assert.deepEqual(JSON.parse(values.get('sea_session_v2')), { email: 'existing@example.com' });
});

test('failed first-time registration removes a partially saved profile', async () => {
  const { persistRegistration } = await loadAuth();
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      if(key === 'sea_session_v2') throw new Error('storage full');
      values.set(key, String(value));
    },
    removeItem(key) { values.delete(key); }
  };

  assert.equal(persistRegistration(storage, { email: 'new@example.com' }, { email: 'new@example.com' }), false);
  assert.equal(values.has('sea_account_v2'), false);
  assert.equal(values.has('sea_session_v2'), false);
});

test('registration replacement guard separates learner emails', async () => {
  const { normalizeEmail, isUsableAccount, registrationConflict } = await loadAuth();
  const existing = { email: ' Learner@Example.com ' };

  assert.equal(normalizeEmail(existing.email), 'learner@example.com');
  assert.equal(isUsableAccount(existing), true);
  assert.equal(isUsableAccount({ email: '   ' }), false);
  assert.equal(isUsableAccount({ name: 'Incomplete learner' }), false);
  assert.equal(isUsableAccount(null), false);
  assert.equal(registrationConflict(existing, { email: 'learner@example.com' }), false);
  assert.equal(registrationConflict(existing, { email: 'different@example.com' }), true);
  assert.equal(registrationConflict(null, { email: 'new@example.com' }), false);
  assert.equal(registrationConflict(existing, { email: '' }), false);
});

test('sign-in recovery URL preserves the safe return target and reason', async () => {
  const { signinUrl } = await loadAuth();

  assert.equal(
    signinUrl('/student-dashboard.html#quiz', 'protected-page'),
    '/signin.html?return=%2Fstudent-dashboard.html%23quiz&reason=protected-page'
  );
  assert.equal(
    signinUrl('/resources.html', ''),
    '/signin.html?return=%2Fresources.html'
  );
});

test('account recovery actions avoid nesting the authentication page', async () => {
  const { registerUrl, accountActionTarget } = await loadAuth();

  assert.equal(accountActionTarget(), '/resources.html');
  assert.equal(
    registerUrl('/student-dashboard.html#quiz'),
    '/register.html?return=%2Fstudent-dashboard.html%23quiz'
  );
});

test('return routing accepts only same-site non-authentication destinations', async () => {
  const accepted = await loadAuth(
    '?return=%2Fstudent-dashboard.html%3Fsection%3Dquiz%23latest'
  );
  assert.equal(
    accepted.safeReturn(),
    '/student-dashboard.html?section=quiz#latest'
  );

  const rejected = [
    '?return=https%3A%2F%2Fevil.example%2Fphish',
    '?return=%2F%2Fevil.example%2Fphish',
    '?return=%2F%5Cevil.example%2Fphish',
    '?return=%2Fsignin.html',
    '?return=%2Fregister.html'
  ];
  for (const search of rejected) {
    const { safeReturn } = await loadAuth(search);
    assert.equal(safeReturn(), '/resources.html', search);
  }
});
