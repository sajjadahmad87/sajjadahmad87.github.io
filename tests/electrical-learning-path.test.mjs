import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('electrical learning progresses from fundamentals through calculation to assessment',()=>{
  const catalog=read('courses.html');
  const path=read('quiz-electrical.html');
  assert.match(catalog,/href="quiz-electrical\.html#learning-path"/);
  assert.match(read('lms.js'),/'electrical-troubleshooting':\{[^}]*href:'\/quiz-electrical\.html#learning-path'/);
  assert.match(path,/id="learning-path"/);
  assert.match(path,/Beginner → Intermediate → Advanced progression/);
  assert.match(path,/href="guides\/vfd-fundamentals\/"/);
  assert.match(path,/href="tools\/three-phase-power-calculator\/#phase-measurement-evidence"/);
  assert.match(path,/href="#knowledge-check"/);
  assert.match(read('student-dashboard.html'),/href="tools\/three-phase-power-calculator\/#phase-measurement-evidence"/);
});

test('each missed electrical answer links to an exact accessible lesson target',()=>{
  const source=read('lms-quiz-electrical.js');
  const calculator=read('tools/three-phase-power-calculator/index.html');
  const links=[...source.matchAll(/r:'([^']+#([^']+))'/g)].map(match=>({href:match[1],fragment:match[2]}));
  assert.equal(links.length,5);
  for(const link of links){
    assert.ok(calculator.includes(`id="${link.fragment}"`),`Missing lesson target: ${link.href}`);
  }
  assert.match(source,/aria-describedby="electrical-feedback-\$\{i\}"/);
  assert.match(source,/link\.textContent='Review this topic'/);
  assert.match(source,/box\.textContent='Select an answer before submitting\.'/);
});
