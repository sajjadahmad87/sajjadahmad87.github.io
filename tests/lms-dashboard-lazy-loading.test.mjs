import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const dashboardUrl=new URL('../student-dashboard.html',import.meta.url);
const navigationUrl=new URL('../lms-dashboard-nav.js',import.meta.url);

const modules=[
  ['assessment-analytics','lms-assessment-analytics.js'],
  ['skills-matrix','lms-skills-matrix.js'],
  ['verified-activity','lms-verified-activity-summary.js'],
  ['practical-coverage','lms-practical-coverage.js'],
  ['reliability-progress','lms-reliability-path-progress.js'],
  ['skills-roadmap','lms-skills-roadmap.js'],
  ['role-roadmap','lms-role-roadmap.js'],
  ['role-weekly-plan','lms-role-weekly-plan.js']
];

test('section-specific dashboard modules are loaded only near their sections',async()=>{
  const [dashboard,navigation]=await Promise.all([
    readFile(dashboardUrl,'utf8'),
    readFile(navigationUrl,'utf8')
  ]);

  for(const [id,src] of modules){
    assert.match(dashboard,new RegExp(`<section class="panel" id="${id}"`));
    assert.doesNotMatch(dashboard,new RegExp(`<script[^>]+src="${src.replaceAll('.','\\.')}"`));
    assert.match(navigation,new RegExp(`\\{id:'${id}',src:'/`+src.replaceAll('.','\\.')+`'\\}`));
  }

  assert.match(navigation,/window\.addEventListener\('hashchange',loadHashTarget\)/);
  assert.match(navigation,/if\(!\('IntersectionObserver' in window\)\)\{\s*lazyModules\.forEach\(loadDashboardModule\)/);
});
