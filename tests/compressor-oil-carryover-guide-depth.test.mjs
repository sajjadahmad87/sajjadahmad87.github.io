import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guide=readFileSync(new URL('../guides/compressor-oil-carryover/index.html',import.meta.url),'utf8');

test('compressor oil-carryover guide provides repeatable sampling and diagnosis depth',()=>{
  for(const id of ['learning-path','define-contamination','sampling-plan','evidence-record','diagnostic-pathways','troubleshooting-sequence','repair-verification','preventive-maintenance']){
    assert.match(guide,new RegExp(`id="${id}"`));
  }
  assert.match(guide,/package outlet/);
  assert.match(guide,/same approved collection method, duration and containers/);
  assert.match(guide,/first stage where contamination becomes worse/);
  assert.match(guide,/accepted, rejected or inconclusive/);
  assert.match(guide,/Part replacement is not proof of correction/);
});

test('compressor oil-carryover guide preserves safe boundaries and connected learning',()=>{
  assert.match(guide,/Approved site procedures, OEM manuals, PTW\/LOTO, isolation, depressurization, risk assessments and competent-person controls/);
  assert.match(guide,/never loosen fittings, open filter housings, defeat drains or dismantle a separator while pressurized/i);
  assert.match(guide,/do not invent an acceptance limit/);
  assert.match(guide,/href="\.\.\/root-cause-analysis-5-why\/"/);
  assert.match(guide,/href="\.\.\/ppm-checklist\/"/);
  assert.match(guide,/href="\.\.\/preventive-maintenance\/"/);
  assert.match(guide,/"dateModified":"2026-08-26"/);
});
