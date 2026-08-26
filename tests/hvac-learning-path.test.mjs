import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('HVAC module milestones lead to exact AHU evidence lessons',()=>{
  const course=read('course.html');
  const guide=read('guides/ahu-troubleshooting/index.html');
  const targets=['operating-baseline','airflow-path','thermal-moisture-evidence','controls-sequence'];
  for(const target of targets){
    assert.match(course,new RegExp(`href="guides/ahu-troubleshooting/#${target}"`));
    assert.ok(guide.includes(`id="${target}"`),`Missing AHU lesson target: ${target}`);
  }
});

test('each missed HVAC answer links to an exact accessible AHU lesson target',()=>{
  const source=read('lms-quiz.js');
  const guide=read('guides/ahu-troubleshooting/index.html');
  const links=[...source.matchAll(/r:'\/guides\/ahu-troubleshooting\/#([^']+)'/g)].map(match=>match[1]);
  assert.equal(links.length,5);
  for(const target of links){
    assert.ok(guide.includes(`id="${target}"`),`Missing AHU remediation target: ${target}`);
  }
  assert.match(source,/aria-describedby="hvac-feedback-\$\{i\}"/);
  assert.match(source,/link\.textContent='Review this topic'/);
  assert.match(source,/box\.textContent='Select an answer before submitting\.'/);
});
