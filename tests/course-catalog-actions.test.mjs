import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const makeButton=(card,isSave=false)=>({
  textContent:isSave?'Save ☆':'Enrol free',attributes:{},
  classList:{contains(name){return isSave&&name==='lms-save';}},
  setAttribute(name,value){this.attributes[name]=value;},
  closest(selector){return selector==='.course-card'?card:null;}
});

test('catalog action recovery has an accessible status region and regression coverage',async()=>{
  const html=await readFile(new URL('../courses.html',import.meta.url),'utf8');
  const workflow=await readFile(new URL('../.github/workflows/lms-recovery-test.yml',import.meta.url),'utf8');
  assert.match(html,/id="catalogActionStatus"[^>]+role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"[^>]+tabindex="-1"/);
  assert.match(html,/course-catalog-actions\.js\?v=20260825/);
  assert.match(workflow,/'course-catalog-actions\.js'/);
  assert.match(workflow,/'tests\/course-catalog-actions\.test\.mjs'/);
});

test('catalog enrolment and saved paths verify writes and restore prior data after failure',async()=>{
  const source=await readFile(new URL('../course-catalog-actions.js',import.meta.url),'utf8');
  const records=new Map([
    ['sea_account_v2',JSON.stringify({email:'learner@example.com'})],
    ['sea_session_v2',JSON.stringify({email:'LEARNER@example.com'})],
    ['sea_lms_state_v1',JSON.stringify({enrolled:{},saved:[],progress:{keep:true},activity:[]})]
  ]);
  let failAfterSet=false,clickHandler;
  const localStorage={
    getItem(key){return records.has(key)?records.get(key):null;},
    setItem(key,value){records.set(key,String(value));if(failAfterSet){failAfterSet=false;throw new Error('quota');}},
    removeItem(key){records.delete(key);}
  };
  const status={textContent:'',attributes:{},focused:false,classList:{remove(){}},setAttribute(name,value){this.attributes[name]=value;},focus(){this.focused=true;}};
  const document={
    querySelector(selector){return selector==='#catalogActionStatus'?status:null;},
    addEventListener(type,listener,capture){if(type==='click'&&capture)clickHandler=listener;}
  };
  const location={href:'',pathname:'/courses.html',search:'',hash:''};
  vm.runInNewContext(source,{document,localStorage,location});
  assert.equal(typeof clickHandler,'function');

  const card={id:'pump-reliability',dataset:{title:'Pump Reliability'},};
  const save=makeButton(card,true);
  clickHandler({target:{closest(){return save;}},stopImmediatePropagation(){}});
  let state=JSON.parse(records.get('sea_lms_state_v1'));
  assert.deepEqual(state.saved,['pump-reliability']);
  assert.equal(save.attributes['aria-pressed'],'true');
  assert.equal(save.textContent,'Saved ★');
  assert.equal(status.textContent,'Pump Reliability saved to My Learning.');

  const enrol=makeButton(card,false);
  clickHandler({target:{closest(){return enrol;}},stopImmediatePropagation(){}});
  state=JSON.parse(records.get('sea_lms_state_v1'));
  assert.ok(state.enrolled['pump-reliability']);
  assert.equal(enrol.textContent,'Enrolled ✓');

  const before=JSON.stringify({enrolled:{},saved:[],progress:{keep:true},activity:[]});
  records.set('sea_lms_state_v1',before);
  const failedSave=makeButton(card,true);
  status.focused=false;
  failAfterSet=true;
  clickHandler({target:{closest(){return failedSave;}},stopImmediatePropagation(){}});
  assert.equal(records.get('sea_lms_state_v1'),before);
  assert.equal(failedSave.textContent,'Save ☆');
  assert.equal(failedSave.attributes['aria-pressed'],undefined);
  assert.equal(status.attributes.role,'alert');
  assert.equal(status.attributes['aria-live'],'assertive');
  assert.equal(status.focused,true);
});
