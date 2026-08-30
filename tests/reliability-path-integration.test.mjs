import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pathway = '/free-video-courses.html#reliability-path';

test('reliability video pathway is connected to the catalog and learner roadmap', () => {
  assert.match(
    read('courses.html'),
    /id="root-cause-analysis"[\s\S]*?href="free-video-courses\.html#reliability-path"[\s\S]*?class="course-proof"/
  );
  assert.match(
    read('lms-skills-roadmap.js'),
    new RegExp(`name:'Preventive Maintenance & PPM'[^\n]*${pathway.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  );
});
