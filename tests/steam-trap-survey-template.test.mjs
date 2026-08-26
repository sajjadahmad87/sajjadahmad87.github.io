import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const pagePath='resources/steam-trap-survey-template/index.html';

test('steam-trap survey template is blank with 33 unique fields',()=>{
  const rows=read('downloads/steam/steam-trap-survey-template.csv').trim().split(/\r?\n/);
  const fields=rows[0].split(',');
  assert.equal(rows.length,1);
  assert.equal(fields.length,33);
  assert.equal(new Set(fields).size,33);
  for(const required of ['Trap_Tag','Operating_State_or_Load','Acoustic_Method_and_Setting','Condition_Classification','Confidence_Level','Post_Repair_Result']){
    assert.ok(fields.includes(required),`missing ${required}`);
  }
});

test('field guide explains evidence, classification, verification and safety limits',()=>{
  const html=read(pagePath);
  assert.match(html,/href="\.\.\/\.\.\/downloads\/steam\/steam-trap-survey-template\.csv" download/);
  assert.match(html,/normal under observed condition/);
  assert.match(html,/not testable\/inconclusive/);
  assert.match(html,/Separate diagnostic evidence from energy-loss and financial estimates/);
  assert.match(html,/Site and OEM requirements take priority/);
  assert.match(html,/PTW\/LOTO/);
  assert.match(html,/"@type":"LearningResource"/);
});

test('template is discoverable from the steam guide, resources hub and sitemap',()=>{
  assert.match(read('guides/steam-trap/index.html'),/href="\.\.\/\.\.\/resources\/steam-trap-survey-template\/"/);
  assert.match(read('resources.html'),/href="resources\/steam-trap-survey-template\/"/);
  assert.match(read('sitemap.xml'),/https:\/\/sajjadengineeringacademy\.com\/resources\/steam-trap-survey-template\//);
});
