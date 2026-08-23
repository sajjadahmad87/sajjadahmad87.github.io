import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadAuth() {
  let source = await readFile(new URL('../auth.js', import.meta.url), 'utf8');
  source = source.replace(
    /\n\}\)\(\);\s*$/,
    '\n;globalThis.__SEA_AUTH_TEST__={normalizeEmail,registrationConflict};\n})();\n'
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
      search: '',
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

test('registration replacement guard separates learner emails', async () => {
  const { normalizeEmail, registrationConflict } = await loadAuth();
  const existing = { email: ' Learner@Example.com ' };

  assert.equal(normalizeEmail(existing.email), 'learner@example.com');
  assert.equal(registrationConflict(existing, { email: 'learner@example.com' }), false);
  assert.equal(registrationConflict(existing, { email: 'different@example.com' }), true);
  assert.equal(registrationConflict(null, { email: 'new@example.com' }), false);
  assert.equal(registrationConflict(existing, { email: '' }), false);
});
