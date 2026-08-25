import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const guideHref = 'guides/ppm-checklist/';

test('PPM guide is discoverable from resources, courses and learner dashboard', () => {
  assert.match(read('resources.html'), new RegExp(`href="${guideHref}"`));
  assert.ok((read('courses.html').match(new RegExp(guideHref, 'g')) || []).length >= 2);
  assert.match(read('student-dashboard.html'), new RegExp(`href="${guideHref}"`));
});

test('blank PPM CSV has a unique 24-field header and no learner records', () => {
  const rows = read('downloads/maintenance/ppm-checklist-template.csv').trim().split(/\r?\n/);
  const fields = rows[0].split(',');
  assert.equal(rows.length, 1);
  assert.equal(fields.length, 24);
  assert.equal(new Set(fields).size, 24);
});

