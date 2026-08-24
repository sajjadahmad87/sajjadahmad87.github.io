import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadLms() {
  const source = await readFile(new URL('../lms.js', import.meta.url), 'utf8');
  const context = {
    console,
    URL,
    URLSearchParams,
    encodeURIComponent,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    document: { addEventListener() {} },
    location: { pathname: '/student-dashboard.html', search: '', hash: '', href: '' },
    window: {}
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'lms.js' });
  return context.window.SEALMS;
}

test('completed tracked courses lead learners to a new path', async () => {
  const { dashboardCourseStatus } = await loadLms();
  const status = dashboardCourseStatus({ title: 'Tracked course', href: '/course.html', modules: 4 }, 100);

  assert.equal(status.complete, true);
  assert.equal(status.heading, 'Course milestones complete');
  assert.equal(status.summary, 'All 4 module milestones reviewed');
  assert.equal(status.resumeLabel, 'Choose next path');
  assert.equal(status.resumeHref, '/courses.html');
  assert.equal(status.listLabel, 'Review');
});

test('unfinished and untracked paths retain continue-learning guidance', async () => {
  const { dashboardCourseStatus } = await loadLms();
  const unfinished = dashboardCourseStatus({ href: '/course.html', modules: 4 }, 75);
  const untracked = dashboardCourseStatus({ href: '/guides/topic/', modules: 0 }, 0);

  assert.equal(unfinished.complete, false);
  assert.equal(unfinished.summary, '75% module progress');
  assert.equal(unfinished.resumeLabel, 'Resume');
  assert.equal(unfinished.resumeHref, '/course.html');
  assert.equal(untracked.complete, false);
  assert.equal(untracked.summary, 'Learning path');
  assert.equal(untracked.resumeHref, '/guides/topic/');
});

test('progress counts only known modules with boolean completion', async () => {
  const { completedModuleCount, progressPercent } = await loadLms();
  const courseId = 'industrial-hvac-troubleshooting';
  const state = {
    progress: {
      [courseId]: {
        modules: {
          fundamentals: true,
          airside: false,
          waterside: 'true',
          'controls-rca': null,
          'unknown-legacy-module': true
        }
      }
    }
  };

  assert.equal(completedModuleCount(state, courseId), 1);
  assert.equal(progressPercent(state, courseId), 25);

  state.progress[courseId].modules = {
    fundamentals: true,
    airside: true,
    waterside: true,
    'controls-rca': true,
    'unknown-legacy-module': true
  };
  assert.equal(completedModuleCount(state, courseId), 4);
  assert.equal(progressPercent(state, courseId), 100);
});

test('LMS state persistence records the update only after storage accepts it', async () => {
  const { persistState } = await loadLms();
  const writes = new Map();
  const storage = { setItem(key, value) { writes.set(key, value); } };
  const state = { enrolled: {}, updatedAt: 'earlier' };

  assert.equal(persistState(storage, state, '2026-08-24T12:00:00.000Z'), true);
  assert.equal(state.updatedAt, '2026-08-24T12:00:00.000Z');
  assert.deepEqual(JSON.parse(writes.get('sea_lms_state_v1')), state);
});

test('failed LMS persistence restores state metadata for safe UI rollback', async () => {
  const { persistState } = await loadLms();
  const storage = { setItem() { throw new Error('storage unavailable'); } };
  const state = { enrolled: {}, updatedAt: 'previous-update' };
  const stateWithoutTimestamp = { enrolled: {} };

  assert.equal(persistState(storage, state, 'failed-update'), false);
  assert.equal(state.updatedAt, 'previous-update');
  assert.equal(persistState(storage, stateWithoutTimestamp, 'failed-update'), false);
  assert.equal(Object.hasOwn(stateWithoutTimestamp, 'updatedAt'), false);
});

test('course-progress reset reports browser storage deletion accurately', async () => {
  const { resetLearningState } = await loadLms();
  const values = new Map([['sea_lms_state_v1', '{"saved":["root-cause-analysis"]}']]);
  const workingStorage = {
    getItem(key) { return values.get(key) ?? null; },
    removeItem(key) { values.delete(key); }
  };
  const blockedStorage = {
    getItem() { return '{"saved":["root-cause-analysis"]}'; },
    removeItem() { throw new Error('storage unavailable'); }
  };

  assert.equal(resetLearningState(workingStorage), true);
  assert.equal(values.has('sea_lms_state_v1'), false);
  assert.equal(resetLearningState(blockedStorage), false);
});

test('dashboard describes the limited scope of course-progress reset', async () => {
  const dashboard = await readFile(new URL('../student-dashboard.html', import.meta.url), 'utf8');

  assert.match(dashboard, /data-lms-reset>Reset course progress<\/button>/);
  assert.match(dashboard, /quiz attempts, study notes, logbook entries, goals and the learner account remain/i);
});
