import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guide=readFileSync(new URL('../guides/steam-trap/index.html',import.meta.url),'utf8');

test('steam-trap guide provides evidence-led diagnosis and verification depth',()=>{
  for(const id of ['learning-path','prepare-survey','evidence-methods','failure-diagnosis','decision-workflow','survey-record','repair-verification']){
    assert.match(guide,new RegExp(`id="${id}"`));
  }
  assert.match(guide,/normal under observed condition/);
  assert.match(guide,/suspected leaking/);
  assert.match(guide,/suspected blocked\/restricted/);
  assert.match(guide,/not testable\/inconclusive/);
  assert.match(guide,/Verify the repair, not just the replacement/);
});

test('steam-trap guide preserves safe boundaries and connected learning',()=>{
  assert.match(guide,/Approved site procedures, OEM manuals, PTW\/LOTO, isolation and depressurization rules/);
  assert.match(guide,/Never loosen fittings, open strainers or dismantle a trap/);
  assert.match(guide,/href="\.\.\/\.\.\/resources\/energy-saving-opportunity-baseline-worksheet\/"/);
  assert.match(guide,/href="\.\.\/ppm-checklist\/"/);
  assert.match(guide,/href="\.\.\/root-cause-analysis-5-why\/"/);
  assert.match(guide,/"dateModified":"2026-08-26"/);
});
