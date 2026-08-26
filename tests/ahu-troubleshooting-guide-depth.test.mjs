import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guide=readFileSync(new URL('../guides/ahu-troubleshooting/index.html',import.meta.url),'utf8');

test('AHU guide provides evidence-led airflow, thermal and controls diagnosis',()=>{
  for(const id of ['learning-path','define-problem','operating-baseline','airflow-path','thermal-moisture-evidence','condensate-moisture','controls-sequence','diagnostic-pathways','repair-verification','minimum-record','preventive-maintenance']){
    assert.match(guide,new RegExp(`id="${id}"`));
  }
  assert.match(guide,/same approved measurement points, units and calibrated instruments/);
  assert.match(guide,/A displayed percentage is not proof/);
  assert.match(guide,/increasing VFD frequency can raise fan load/);
  assert.match(guide,/Temperature reduction alone does not show/);
  assert.match(guide,/Replacing a sensor or actuator is not proof of correction/);
});

test('AHU guide preserves safe limits, verification and connected learning',()=>{
  assert.match(guide,/approved site procedures, OEM manuals, PTW\/LOTO/);
  assert.match(guide,/Do not invent a universal supply-air temperature, filter pressure, fan speed or humidity limit/);
  assert.match(guide,/Verify the repair under representative duty/);
  assert.match(guide,/href="\.\.\/vfd-fundamentals\/"/);
  assert.match(guide,/href="\.\.\/ppm-checklist\/"/);
  assert.match(guide,/href="\.\.\/root-cause-analysis-5-why\/"/);
  assert.match(guide,/https:\/\/www\.epa\.gov\/iaq-schools\//);
  assert.match(guide,/https:\/\/www\.ashrae\.org\/technical-resources\/bookstore\/standards-62-1-62-2/);
  assert.match(guide,/"dateModified":"2026-08-26"/);
});
