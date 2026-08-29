import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guide=readFileSync(new URL('../guides/plc-troubleshooting/index.html',import.meta.url),'utf8');
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('PLC guide traces evidence through the complete control path',()=>{
  for(const id of ['prerequisites-outcomes','four-layer-model','symptom-map','workflow','define-symptom','preserve-evidence','safe-access','trace-inputs','trace-logic','trace-outputs','networks-intermittent','repair-verification','scenario-examples','change-control','minimum-record','learning-path']){
    assert.match(guide,new RegExp(`id="${id}"`));
  }
  for(const term of ['Input:','Logic:','Output:','Field action:']) assert.match(guide,new RegExp(term));
  assert.match(guide,/A PLC program is one layer of a machine, not the whole machine/);
  assert.match(guide,/move from a verified observation to the next boundary/);
  assert.match(guide,/A disappearing alarm after reset is not repair verification/);
});

test('PLC guide preserves safety, change control and connected learning',()=>{
  assert.match(guide,/approved site procedures, OEM manuals, PTW\/LOTO/);
  assert.match(guide,/Never bypass an interlock or safety function/);
  assert.match(guide,/a current recoverable backup, change control and a tested recovery plan/);
  assert.match(guide,/Do not use a live production controller as a training environment/);
  assert.match(guide,/href="\.\.\/\.\.\/free-video-courses\.html#automation-path"/);
  assert.match(guide,/href="\.\.\/vfd-fundamentals\/#troubleshooting-sequence"/);
  assert.match(guide,/https:\/\/www\.osha\.gov\/control-hazardous-energy/);
  assert.match(guide,/https:\/\/www\.cisa\.gov\/cybersecurity-performance-goals-2-0-cpg-2-0/);
  assert.match(guide,/https:\/\/support\.industry\.siemens\.com\/cs\/document\/109752283/);
  assert.match(guide,/"dateModified":"2026-08-29"/);
});

test('PLC catalog and learner dashboard resume the dedicated PLC pathway',()=>{
  assert.match(read('courses.html'),/id="plc-automation-fundamentals"[\s\S]*?href="guides\/plc-troubleshooting\/"/);
  assert.match(read('lms.js'),/'plc-automation-fundamentals':\{[^}]*href:'\/guides\/plc-troubleshooting\/'/);
  assert.doesNotMatch(read('lms.js'),/'plc-automation-fundamentals':\{[^}]*href:'\/guides\/vfd-fundamentals\/'/);
});
