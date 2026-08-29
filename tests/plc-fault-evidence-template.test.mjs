import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const pagePath='resources/plc-fault-evidence-worksheet/index.html';

test('PLC fault evidence template is blank with 46 unique fields',()=>{
  const rows=read('downloads/automation/plc-fault-evidence-template.csv').trim().split(/\r?\n/);
  const fields=rows[0].split(',');
  assert.equal(rows.length,1);
  assert.equal(fields.length,46);
  assert.equal(new Set(fields).size,46);
  for(const required of ['Machine_Mode','Sequence_Step','Physical_Input_Condition','PLC_Input_Tag_State','Logic_or_Sequence_Evidence','PLC_Output_Command_State','Actuator_or_Field_Action','Contradicting_Evidence','Safeguards_Restored','Post_Repair_Result']){
    assert.ok(fields.includes(required),`missing ${required}`);
  }
});

test('PLC worksheet explains control-path evidence, verification and safety limits',()=>{
  const html=read(pagePath);
  assert.match(html,/href="\.\.\/\.\.\/downloads\/automation\/plc-fault-evidence-template\.csv" download/);
  assert.match(html,/one row per fault event or controlled training scenario/i);
  assert.match(html,/Physical_Input_Condition \/ Input_Module_Indication \/ PLC_Input_Tag_State/);
  assert.match(html,/Supporting_Evidence \/ Contradicting_Evidence/);
  assert.match(html,/no universal voltage, timing, network, fault-code, bypass or shutdown limits/);
  assert.match(html,/PTW\/LOTO/);
  assert.match(html,/Never force I\/O, bypass an interlock or safety function/);
  assert.match(html,/"@type":"LearningResource"/);
});

test('PLC worksheet connects the guide, assessment, resources hub, logbook and sitemap',()=>{
  assert.match(read('guides/plc-troubleshooting/index.html'),/href="\.\.\/\.\.\/resources\/plc-fault-evidence-worksheet\/"/);
  assert.match(read('quiz-plc.html'),/href="resources\/plc-fault-evidence-worksheet\/"/);
  assert.match(read('resources.html'),/href="resources\/plc-fault-evidence-worksheet\/"/);
  assert.match(read(pagePath),/href="\.\.\/\.\.\/student-dashboard\.html#logbook"/);
  assert.match(read('sitemap.xml'),/https:\/\/sajjadengineeringacademy\.com\/resources\/plc-fault-evidence-worksheet\//);
});
