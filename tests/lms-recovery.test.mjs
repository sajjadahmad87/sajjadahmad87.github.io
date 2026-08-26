import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourcePath = process.env.SEA_LMS_IMPORT_PATH || new URL('../lms-import.js', import.meta.url);

class StorageMock {
  constructor(initial = {}, failKey = '') {
    this.values = new Map(Object.entries(initial));
    this.failKey = failKey;
    this.failed = false;
  }

  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  removeItem(key) { this.values.delete(key); }
  setItem(key, value) {
    if (key === this.failKey && !this.failed) {
      this.failed = true;
      throw new Error('simulated storage failure');
    }
    this.values.set(key, String(value));
  }
}

async function loadRecovery({ initial = {}, failKey = '', confirmResult = true } = {}) {
  const localStorage = new StorageMock(initial, failKey);
  const attributes = new Map();
  const classes = new Set();
  let focuses = 0;
  const live = {
    textContent: '',
    classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    focus() { focuses += 1; }
  };
  let reloads = 0;
  let confirms = 0;
  let source = await readFile(sourcePath, 'utf8');
  source = source.replace(
    /\n\}\)\(\);\s*$/,
    '\n;globalThis.__SEA_RECOVERY_TEST__={collectStorage,validateComplete,restoreComplete};\n})();\n'
  );
  assert.match(source, /__SEA_RECOVERY_TEST__/, 'test hook injection failed');

  const context = {
    console,
    localStorage,
    document: {
      addEventListener() {},
      querySelector(selector) { return selector === '[data-lms-live]' ? live : null; }
    },
    confirm() { confirms += 1; return confirmResult; },
    location: { reload() { reloads += 1; } },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {}
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'lms-import.js' });
  return {
    ...context.__SEA_RECOVERY_TEST__,
    localStorage,
    live,
    get focuses() { return focuses; },
    get reloads() { return reloads; },
    get confirms() { return confirms; }
  };
}

function completeBackup(storage, learner = {}) {
  return {
    format: 'sea-portable-learning-backup',
    version: 1,
    exportedAt: '2026-08-23T10:00:00.000Z',
    learner,
    storage
  };
}

test('validates a complete backup and rejects unsafe storage keys', async () => {
  const harness = await loadRecovery();
  const valid = completeBackup({ sea_lms_state_v1: { progress: { safety: 1 } } });
  assert.deepEqual(Array.from(harness.validateComplete(valid)), ['sea_lms_state_v1']);

  const unsafe = completeBackup({ sea_account_v2: { email: 'other@example.com' } });
  assert.throws(() => harness.validateComplete(unsafe), /Unsafe storage key/);
});

test('rejects unsupported and prototype-polluting complete-backup data', async () => {
  const harness = await loadRecovery();
  assert.throws(
    () => harness.validateComplete(completeBackup({ sea_lms_unrecognized_v1: {} })),
    /Unsupported storage key/
  );
  const polluted = JSON.parse('{"sea_lms_state_v1":{"__proto__":{"polluted":true}}}');
  assert.throws(
    () => harness.validateComplete(completeBackup(polluted)),
    /unsafe object key/
  );
});

test('rejects non-numeric strategy scores before restoring a backup', async () => {
  const harness = await loadRecovery();
  const payload = completeBackup({
    sea_lms_strategy_experiments_v1: {
      active: null,
      history: [{ baselineScore: '<img src=x onerror=alert(1)>', afterScore: 80 }]
    }
  });
  assert.throws(() => harness.validateComplete(payload), /Invalid strategy score/);
});

test('restores valid LMS data and records recovery metadata', async () => {
  const harness = await loadRecovery();
  const payload = completeBackup({
    sea_lms_state_v1: { progress: { pumps: 2 } },
    sea_lms_logbook_v1: [{ id: 'entry-1', title: 'Pump inspection' }]
  });
  const keys = harness.validateComplete(payload);

  assert.equal(harness.restoreComplete(payload, keys), true);
  assert.deepEqual(JSON.parse(harness.localStorage.getItem('sea_lms_state_v1')), payload.storage.sea_lms_state_v1);
  assert.deepEqual(JSON.parse(harness.localStorage.getItem('sea_lms_logbook_v1')), payload.storage.sea_lms_logbook_v1);
  assert.equal(JSON.parse(harness.localStorage.getItem('sea_lms_backup_meta')).source, 'restore');
  assert.equal(harness.reloads, 1);
});

test('rolls back every affected record when storage fails midway', async () => {
  const original = {
    sea_lms_state_v1: JSON.stringify({ progress: { old: 1 } }),
    sea_lms_logbook_v1: JSON.stringify([{ id: 'old-entry' }])
  };
  const harness = await loadRecovery({ initial: original, failKey: 'sea_lms_logbook_v1' });
  const payload = completeBackup({
    sea_lms_state_v1: { progress: { replacement: 1 } },
    sea_lms_logbook_v1: [{ id: 'replacement-entry' }]
  });

  assert.equal(harness.restoreComplete(payload, harness.validateComplete(payload)), false);
  assert.equal(harness.localStorage.getItem('sea_lms_state_v1'), original.sea_lms_state_v1);
  assert.equal(harness.localStorage.getItem('sea_lms_logbook_v1'), original.sea_lms_logbook_v1);
  assert.match(harness.live.textContent, /previous browser-local LMS data was retained/i);
  assert.equal(harness.reloads, 0);
});

test('blocks a backup belonging to another signed-in learner', async () => {
  const harness = await loadRecovery({
    initial: { sea_account_v2: JSON.stringify({ email: 'learner@example.com' }) }
  });
  const payload = completeBackup(
    { sea_lms_state_v1: { progress: {} } },
    { email: 'different@example.com' }
  );

  assert.equal(harness.restoreComplete(payload, harness.validateComplete(payload)), false);
  assert.equal(harness.confirms, 0);
  assert.match(harness.live.textContent, /different learner account/i);
  assert.equal(harness.live.classList.contains('lms-live-error'), true);
  assert.equal(harness.live.getAttribute('role'), 'alert');
  assert.equal(harness.live.getAttribute('aria-live'), 'assertive');
  assert.equal(harness.live.getAttribute('tabindex'), '-1');
  assert.equal(harness.focuses, 1);
});


test('complete backup round-trip preserves every quiz attempt store', async () => {
  const quizRecords = {
    sea_lms_quiz_v1: { attempts: [{ courseId: 'industrial-hvac-troubleshooting', score: 4, total: 5, at: '2026-08-23T18:00:00.000Z' }] },
    sea_lms_quiz_rca_v1: { attempts: [{ courseId: 'root-cause-analysis', score: 5, total: 5, at: '2026-08-23T18:05:00.000Z' }] },
    sea_lms_quiz_ppm_v1: { attempts: [{ courseId: 'preventive-maintenance-ppm', score: 3, total: 5, at: '2026-08-23T18:10:00.000Z' }] },
    sea_lms_quiz_electrical_v1: { attempts: [{ courseId: 'electrical-troubleshooting', score: 4, total: 5, at: '2026-08-23T18:15:00.000Z' }] }
  };
  const initial = Object.fromEntries(Object.entries(quizRecords).map(([key, value]) => [key, JSON.stringify(value)]));
  initial.sea_account_v2 = JSON.stringify({ email: 'learner@example.com' });
  initial.sea_session_v2 = JSON.stringify({ email: 'learner@example.com' });

  const exporter = await loadRecovery({ initial });
  const collected = JSON.parse(JSON.stringify(exporter.collectStorage()));
  assert.deepEqual(Object.keys(collected).sort(), Object.keys(quizRecords).sort());
  assert.equal(Object.hasOwn(collected, 'sea_account_v2'), false);
  assert.equal(Object.hasOwn(collected, 'sea_session_v2'), false);

  const payload = completeBackup(collected, { email: 'learner@example.com' });
  const restorer = await loadRecovery({
    initial: { sea_account_v2: JSON.stringify({ email: 'learner@example.com' }) }
  });
  const keys = restorer.validateComplete(payload);

  assert.equal(restorer.restoreComplete(payload, keys), true);
  for (const [key, value] of Object.entries(quizRecords)) {
    assert.deepEqual(JSON.parse(restorer.localStorage.getItem(key)), value);
  }
});
