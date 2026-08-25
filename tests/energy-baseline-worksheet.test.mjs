import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pagePath = 'resources/energy-saving-opportunity-baseline-worksheet/index.html';
const pageHref = 'resources/energy-saving-opportunity-baseline-worksheet/';
const downloadHref = '../../downloads/energy/energy-saving-opportunity-baseline-template.csv';

test('energy baseline worksheet is blank and has a unique 37-field header', () => {
  const rows = read('downloads/energy/energy-saving-opportunity-baseline-template.csv').trim().split(/\r?\n/);
  const fields = rows[0].split(',');
  assert.equal(rows.length, 1);
  assert.equal(fields.length, 37);
  assert.equal(new Set(fields).size, 37);
  for (const required of ['Baseline_Average_Input_kW', 'Useful_Output_or_Service', 'Estimated_Annual_kWh_Saved', 'Verified_Annual_kWh_Saved', 'Safety_and_Operational_Controls']) {
    assert.ok(fields.includes(required), `missing ${required}`);
  }
});

test('worksheet page explains calculation, verification and safety boundaries', () => {
  const html = read(pagePath);
  assert.match(html, new RegExp(`href="${downloadHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" download`));
  assert.match(html, /Annual energy \(kWh\) = average input power/);
  assert.match(html, /Simple payback \(years\) = project cost/);
  assert.match(html, /Never overwrite the original estimate/);
  assert.match(html, /Site and OEM data take priority/);
  assert.match(html, /PTW\/LOTO/);
  assert.match(html, /"@type":"LearningResource"/);
  assert.match(html, /<main id="main-content"[^>]*tabindex="-1">/);
});

test('worksheet is discoverable from the calculator, resources hub and sitemap', () => {
  assert.match(read('tools/energy-cost-payback-calculator/index.html'), new RegExp(`href="../../${pageHref}"`));
  assert.match(read('resources.html'), new RegExp(`href="${pageHref}"`));
  assert.match(read('sitemap.xml'), /https:\/\/sajjadengineeringacademy\.com\/resources\/energy-saving-opportunity-baseline-worksheet\//);
});
