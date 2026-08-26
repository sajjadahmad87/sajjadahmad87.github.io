import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const pagePath='resources/bearing-failure-evidence-worksheet/index.html';

test('bearing-failure evidence template is blank with 47 unique fields',()=>{
  const rows=read('downloads/reliability/bearing-failure-evidence-template.csv').trim().split(/\r?\n/);
  const fields=rows[0].split(',');
  assert.equal(rows.length,1);
  assert.equal(fields.length,47);
  assert.equal(new Set(fields).size,47);
  for(const required of ['Bearing_Position','Measurement_Direction','Instrument_or_Method','Lubricant_Condition','Competing_Hypotheses','Contradicting_Evidence','Post_Repair_Trend_Result']){
    assert.ok(fields.includes(required),`missing ${required}`);
  }
});

test('field guide explains repeatability, cause testing, verification and safety limits',()=>{
  const html=read(pagePath);
  assert.match(html,/href="\.\.\/\.\.\/downloads\/reliability\/bearing-failure-evidence-template\.csv" download/);
  assert.match(html,/one row per investigation event/i);
  assert.match(html,/Supporting_Evidence \/ Contradicting_Evidence/);
  assert.match(html,/no universal vibration, temperature, clearance, lubrication or shutdown limits/);
  assert.match(html,/Site and OEM requirements take priority/);
  assert.match(html,/PTW\/LOTO/);
  assert.match(html,/"@type":"LearningResource"/);
});

test('worksheet is discoverable from the bearing guide, resources hub and sitemap',()=>{
  assert.match(read('guides/bearing-failure/index.html'),/href="\.\.\/\.\.\/resources\/bearing-failure-evidence-worksheet\/"/);
  assert.match(read('resources.html'),/href="resources\/bearing-failure-evidence-worksheet\/"/);
  assert.match(read('sitemap.xml'),/https:\/\/sajjadengineeringacademy\.com\/resources\/bearing-failure-evidence-worksheet\//);
});
