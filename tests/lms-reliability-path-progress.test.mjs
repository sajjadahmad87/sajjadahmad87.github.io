import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../lms-reliability-path-progress.js',import.meta.url),'utf8');
const load=(values=new Map(),fail=false)=>{
  const storage={
    getItem:key=>values.has(key)?values.get(key):null,
    setItem(key,value){if(fail)throw new Error('blocked');values.set(key,value)},
    removeItem:key=>values.delete(key)
  };
  const document={readyState:'complete',querySelector:()=>null,addEventListener(){},dispatchEvent(){}};
  const window={};
  vm.runInNewContext(source,{window,document,localStorage:storage,CustomEvent:class{}});
  return {api:window.SEALMSReliabilityProgress,values,storage};
};

test('reliability activity distinguishes learner confirmation from recorded assessment activity',()=>{
  const values=new Map([
    ['sea_lms_reliability_path_v1',JSON.stringify({steps:{video:true,worksheet:true,unknown:true}})],
    ['sea_lms_quiz_rca_v1',JSON.stringify({attempts:[{score:2,total:5}]})]
  ]);
  const {api}=load(values);
  const state=api.readState();
  assert.deepEqual({...state.steps},{video:true,worksheet:true});
  assert.equal(api.hasKnowledgeCheck(),true);
  assert.equal(api.coverage(state,true),3);
});

test('reliability milestone writes are verified and failed writes retain prior data',()=>{
  const before=JSON.stringify({steps:{video:true},updatedAt:'2026-08-30T00:00:00.000Z'});
  const values=new Map([['sea_lms_reliability_path_v1',before]]);
  const {api,storage}=load(values,true);
  assert.equal(api.persist(storage,{steps:{worksheet:true}}),false);
  assert.equal(values.get('sea_lms_reliability_path_v1'),before);
});

test('reliability tracker is portable and avoids competency claims',()=>{
  const dashboard=readFileSync(new URL('../student-dashboard.html',import.meta.url),'utf8');
  const recovery=readFileSync(new URL('../lms-import.js',import.meta.url),'utf8');
  assert.match(dashboard,/id="reliability-progress"/);
  assert.match(recovery,/'sea_lms_reliability_path_v1'/);
  assert.match(source,/does not verify viewing time, practical competence, task authorization, certification or external-course completion/);
});
