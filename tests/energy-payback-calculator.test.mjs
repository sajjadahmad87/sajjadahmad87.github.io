import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../tools/energy-cost-payback-calculator/index.html',import.meta.url),'utf8');
const script=html.match(/<script>\s*(\(\(\)=>\{[\s\S]*?\}\)\(\);)\s*<\/script>\s*<\/body>/)?.[1];

class FakeElement{
  constructor(id,value=''){
    this.id=id;
    this.value=String(value);
    this.textContent='';
    this.attributes=new Map();
    this.listeners=new Map();
  }
  addEventListener(type,handler){this.listeners.set(type,handler);}
  emit(type){this.listeners.get(type)?.({type,target:this});}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  removeAttribute(name){this.attributes.delete(name);}
  getAttribute(name){return this.attributes.get(name)??null;}
  focus(){focused=this.id;}
}

let focused='';

const setup=()=>{
  focused='';
  const values={basePower:30,newPower:25,hoursDay:16,daysYear:300,tariff:.45,projectCost:12000};
  const ids=[...Object.keys(values),'baseKwh','newKwh','savedKwh','savedCost','baseCost','newCost','reductionPct','payback','error','resultAnnouncement','calculate','reset'];
  const elements=Object.fromEntries(ids.map(id=>[id,new FakeElement(id,values[id]??'')]));
  vm.runInNewContext(script,{document:{getElementById:id=>elements[id]},Number,Object,Set});
  return elements;
};

const numeric=text=>Number(text.replace(/,/g,''));

test('energy calculator reproduces the documented worked example',()=>{
  assert.ok(script,'calculator script was not found');
  const el=setup();

  assert.equal(numeric(el.baseKwh.textContent),144000);
  assert.equal(numeric(el.newKwh.textContent),120000);
  assert.equal(numeric(el.savedKwh.textContent),24000);
  assert.equal(numeric(el.baseCost.textContent),64800);
  assert.equal(numeric(el.newCost.textContent),54000);
  assert.equal(numeric(el.savedCost.textContent),10800);
  assert.equal(numeric(el.reductionPct.textContent),16.67);
  assert.equal(numeric(el.payback.textContent),1.11);
});

test('blank, non-finite and fractional-day inputs are rejected accessibly',()=>{
  const el=setup();
  el.basePower.value='';
  el.calculate.emit('click');
  assert.match(el.error.textContent,/Complete all six fields/);
  assert.equal(el.basePower.getAttribute('aria-invalid'),'true');
  assert.equal(focused,'basePower');
  assert.equal(el.baseKwh.textContent,'—');

  el.basePower.value='1e309';
  el.daysYear.value='300.5';
  el.calculate.emit('click');
  assert.match(el.error.textContent,/whole operating days from 1 to 366/);
  assert.equal(el.basePower.getAttribute('aria-invalid'),'true');
  assert.equal(el.daysYear.getAttribute('aria-invalid'),'true');
});

test('non-saving cases do not claim a payback',()=>{
  const el=setup();
  el.newPower.value='35';
  el.calculate.emit('click');

  assert.equal(el.payback.textContent,'—');
  assert.ok(numeric(el.reductionPct.textContent)<0);
  assert.match(el.error.textContent,/does not produce positive cost savings/);
  assert.match(el.resultAnnouncement.textContent,/No positive cost saving or simple payback/);
});
