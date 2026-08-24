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
