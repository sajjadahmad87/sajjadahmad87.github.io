import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourcePath = process.env.SEA_LMS_LOGBOOK_PATH || new URL('../lms-logbook.js', import.meta.url);
const LOG_KEY = 'sea_lms_logbook_v1';

class StorageMock {
  constructor(initial = {}) { this.values = new Map(Object.entries(initial)); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  removeItem(key) { this.values.delete(key); }
  setItem(key, value) { this.values.set(key, String(value)); }
}

async function loadLogbook(initialEntries = []) {
  const listeners = new Map();
  const localStorage = new StorageMock({ [LOG_KEY]: JSON.stringify(initialEntries) });
  const live = { textContent: '' };
  const downloads = [];
  let clicks = 0;
  let source = await readFile(sourcePath, 'utf8');
  source = source.replace(
    /\n\}\)\(\);\s*$/,
    '\n;globalThis.__SEA_LOGBOOK_TEST__={validateImport};\n})();\n'
  );
  assert.match(source, /__SEA_LOGBOOK_TEST__/, 'test hook injection failed');

  class BlobMock {
    constructor(parts, options) { this.parts = parts; this.type = options?.type || ''; downloads.push(this); }
  }
  const anchor = {
    hidden: false,
    click() { clicks += 1; },
    remove() {}
  };
  const document = {
    body: { appendChild() {} },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    createElement(tag) { assert.equal(tag, 'a'); return anchor; },
    querySelector(selector) { return selector === '[data-lms-live]' ? live : null; },
    querySelectorAll() { return []; }
  };
  const context = {
    console,
    localStorage,
    document,
    Blob: BlobMock,
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    confirm() { return true; },
    requestAnimationFrame(callback) { callback(); return 1; },
    setTimeout(callback) { callback(); return 1; },
    crypto: { randomUUID() { return 'test-id'; } }
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'lms-logbook.js' });

  return {
    validateImport: context.__SEA_LOGBOOK_TEST__.validateImport,
    localStorage,
    live,
    downloads,
    anchor,
    get clicks() { return clicks; },
    async dispatch(type, target) {
      for (const handler of listeners.get(type) || []) await handler({ target });
    }
  };
}

function entry(overrides = {}) {
  return {
    id: 'entry-1',
    topic: 'Preventive Maintenance / PPM',
    activity: 'Inspection',
    title: 'Pump inspection',
    system: 'Process pump',
    evidence: 'Observed condition and recorded readings.',
    learning: 'Confirmed the inspection sequence.',
    nextAction: 'Review the OEM maintenance instruction.',
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-22T09:30:00.000Z',
    ...overrides
  };
}

function closestTarget(matches) {
  return { closest(selector) { return matches[selector] || null; } };
}

test('standalone JSON export can be imported with metadata preserved', async () => {
  const original = entry();
  const exporter = await loadLogbook([original]);
  await exporter.dispatch('click', closestTarget({ '[data-log-export-json]': {} }));

  assert.equal(exporter.clicks, 1);
  assert.equal(exporter.downloads.length, 1);
  assert.equal(exporter.downloads[0].type, 'application/json');
  const payload = JSON.parse(exporter.downloads[0].parts.join(''));
  assert.equal(payload.type, 'SEA practical learning logbook');
  assert.deepEqual(payload.entries[0], original);

  const retained = entry({ id: 'entry-2', title: 'Retained local entry', updatedAt: undefined });
  delete retained.updatedAt;
  const importer = await loadLogbook([
    entry({ title: 'Older local version', updatedAt: undefined }),
    retained
  ]);
  const input = {
    files: [{ size: 1024, async text() { return JSON.stringify(payload); } }],
    value: 'backup.json'
  };
  await importer.dispatch('change', closestTarget({ '[data-log-import-file]': input }));

  const restored = JSON.parse(importer.localStorage.getItem(LOG_KEY));
  assert.equal(restored.length, 2);
  assert.deepEqual(restored[0], original);
  assert.deepEqual(restored[1], retained);
  assert.match(importer.live.textContent, /1 logbook entries imported safely; 1 other current entries were retained/i);
});

test('rejects duplicate IDs and malformed timestamps without changing current entries', async () => {
  const current = [entry({ id: 'current-entry' })];
  const harness = await loadLogbook(current);
  const duplicatePayload = {
    type: 'SEA practical learning logbook',
    entries: [entry(), entry({ title: 'Duplicate ID' })]
  };
  assert.throws(() => harness.validateImport(duplicatePayload), /duplicate entry IDs/i);

  const malformedPayload = {
    type: 'SEA practical learning logbook',
    entries: [entry({ createdAt: 'not-a-date' })]
  };
  const input = {
    files: [{ size: 1024, async text() { return JSON.stringify(malformedPayload); } }],
    value: 'invalid.json'
  };
  await harness.dispatch('change', closestTarget({ '[data-log-import-file]': input }));

  assert.deepEqual(JSON.parse(harness.localStorage.getItem(LOG_KEY)), current);
  assert.match(harness.live.textContent, /invalid timestamp/i);
});
