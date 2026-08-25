import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const guideHref = 'guides/ppm-checklist/';
const strategyHref = 'guides/preventive-maintenance/';

test('preventive-maintenance learning flows from strategy to checklist and assessment', () => {
  assert.match(read('resources.html'), new RegExp(`href="${guideHref}"`));
  assert.match(read('courses.html'), new RegExp(`href="${guideHref}"`));
  assert.ok((read('courses.html').match(new RegExp(strategyHref, 'g')) || []).length >= 2);
  assert.match(read('student-dashboard.html'), new RegExp(`href="${guideHref}"`));
  assert.match(read('student-dashboard.html'), new RegExp(`href="${strategyHref}"`));
  assert.match(read('lms.js'), /'preventive-maintenance-ppm':\{[^}]*href:'\/guides\/preventive-maintenance\/'/);
  assert.match(read('lms-role-roadmap.js'), /name:'Preventive Maintenance & PPM'[^\n]*study:'\/guides\/preventive-maintenance\/'/);
  assert.match(read('lms-role-weekly-plan.js'), /name:'Preventive Maintenance & PPM'[^\n]*study:'\/guides\/preventive-maintenance\/'/);
  assert.match(read('lms-assessment-analytics.js'), /resourceHref:'\/guides\/preventive-maintenance\/'[^\n]*toolHref:'\/guides\/ppm-checklist\/'/);
});

test('blank PPM CSV has a unique 24-field header and no learner records', () => {
  const rows = read('downloads/maintenance/ppm-checklist-template.csv').trim().split(/\r?\n/);
  const fields = rows[0].split(',');
  assert.equal(rows.length, 1);
  assert.equal(fields.length, 24);
  assert.equal(new Set(fields).size, 24);
});
