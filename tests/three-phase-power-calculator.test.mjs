import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../tools/three-phase-power-calculator/index.html',import.meta.url),'utf8');
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
  const values={voltage:400,current:50,pf:.85,efficiency:''};
  const ids=[...Object.keys(values),'kva','kw','kvar','outputKw','error','resultAnnouncement','calculate','reset'];
  const elements=Object.fromEntries(ids.map(id=>[id,new FakeElement(id,values[id]??'')]));
  vm.runInNewContext(script,{document:{getElementById:id=>elements[id]},Number,Object,Math});
  return elements;
};

test('three-phase calculator reproduces the documented balanced-load example',()=>{
  assert.ok(script,'calculator script was not found');
  const el=setup();
  assert.equal(el.kva.textContent,'34.64');
  assert.equal(el.kw.textContent,'29.44');
  assert.equal(el.kvar.textContent,'18.25');
  assert.equal(el.outputKw.textContent,'—');
  el.efficiency.value='92';
  el.calculate.emit('click');
  assert.equal(el.outputKw.textContent,'27.09');
  assert.match(el.resultAnnouncement.textContent,/Reactive power magnitude 18\.25/);
});

test('blank and non-finite inputs are rejected accessibly',()=>{
  const el=setup();
  el.current.value='';
  el.calculate.emit('click');
  assert.match(el.error.textContent,/Complete voltage, current and power factor/);
  assert.equal(el.current.getAttribute('aria-invalid'),'true');
  assert.equal(focused,'current');
  assert.equal(el.kva.textContent,'—');

  el.current.value='50';
  el.voltage.value='1e309';
  el.efficiency.value='101';
  el.calculate.emit('click');
  assert.equal(el.voltage.getAttribute('aria-invalid'),'true');
  assert.equal(el.efficiency.getAttribute('aria-invalid'),'true');
  assert.equal(focused,'voltage');
});

test('valid boundaries and reactive-power limitations are explicit',()=>{
  const el=setup();
  el.current.value='0';
  el.pf.value='0';
  el.calculate.emit('click');
  assert.equal(el.kva.textContent,'0.00');
  assert.equal(el.kw.textContent,'0.00');
  assert.equal(el.kvar.textContent,'0.00');
  assert.match(html,/Power-factor magnitude alone cannot determine whether reactive power is leading or lagging/);
  assert.match(html,/balanced, approximately sinusoidal three-phase systems/);
  assert.match(html,/PTW\/LOTO, risk assessments/);
});
