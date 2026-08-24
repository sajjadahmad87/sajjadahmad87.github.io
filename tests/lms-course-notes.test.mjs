import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourcePath = new URL('../lms-course-notes.js', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const instrumented = source.replace(
  /\n\}\)\(\);\s*$/,
  '\n;globalThis.__SEA_NOTES_TEST__={read,write,markReviewed};\n})();\n'
);

const createHarness = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  const localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const context = {
    console,
    Date,
    JSON,
    localStorage,
    document: {
      readyState: 'loading',
      addEventListener() {},
      querySelector() { return null; }
    },
    window: { addEventListener() {} }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(instrumented, context);
  return { api: context.__SEA_NOTES_TEST__, values };
};

test('queued study notes persist through a storage round trip', () => {
  const { api } = createHarness();
  const note = {
    text: 'Recheck the bearing failure evidence.',
    needsReview: true,
    updatedAt: '2026-08-23T12:00:00.000Z'
  };

  api.write({ 'root-cause-analysis': note });
  const restored = api.read()['root-cause-analysis'];

  assert.deepEqual(
    JSON.parse(JSON.stringify(restored)),
    note
  );
});

test('mark reviewed preserves note content and records review metadata', () => {
  const stored = JSON.stringify({
    'root-cause-analysis': {
      text: 'Compare the evidence against each cause.',
      needsReview: true,
      updatedAt: '2026-08-23T12:00:00.000Z'
    }
  });
  const { api } = createHarness({ sea_lms_course_notes_v1: stored });

  assert.equal(api.markReviewed('root-cause-analysis'), true);
  const restored = api.read()['root-cause-analysis'];

  assert.equal(restored.text, 'Compare the evidence against each cause.');
  assert.equal(restored.updatedAt, '2026-08-23T12:00:00.000Z');
  assert.equal(restored.needsReview, false);
  assert.equal(Number.isNaN(Date.parse(restored.reviewedAt)), false);
});

test('unknown notes are not created when marked reviewed', () => {
  const stored = JSON.stringify({
    'plc-automation-fundamentals': {
      text: 'Review scan-cycle sequencing.',
      needsReview: true,
      updatedAt: '2026-08-23T12:00:00.000Z'
    }
  });
  const { api, values } = createHarness({ sea_lms_course_notes_v1: stored });

  assert.equal(api.markReviewed('missing-note'), false);
  assert.equal(values.get('sea_lms_course_notes_v1'), stored);
});

test('legacy notes without revision metadata remain readable', () => {
  const stored = JSON.stringify({
    'preventive-maintenance-planning': {
      text: 'Legacy note',
      updatedAt: '2026-08-20T08:00:00.000Z'
    }
  });
  const { api } = createHarness({ sea_lms_course_notes_v1: stored });

  assert.equal(api.read()['preventive-maintenance-planning'].text, 'Legacy note');
});

test('dashboard study notes are lazy-loaded with a stable navigation target', async () => {
  const dashboard = await readFile(new URL('../student-dashboard.html', import.meta.url), 'utf8');
  const navigation = await readFile(new URL('../lms-dashboard-nav.js', import.meta.url), 'utf8');
  const marketplace = await readFile(new URL('../marketplace.js', import.meta.url), 'utf8');

  assert.doesNotMatch(dashboard, /<script[^>]+src="lms-course-notes\.js/);
  assert.match(dashboard, /<a href="#study-notes">Study Notes<\/a>/);
  assert.match(dashboard, /<section class="panel" id="study-notes"/);
  assert.match(navigation, /\{id:'study-notes',src:'\/lms-course-notes\.js\?v=20260824-lazy'\}/);
  assert.doesNotMatch(marketplace, /document\.querySelector\('\[data-lms-dashboard\]'\)\|\|cards\.length/);
});
