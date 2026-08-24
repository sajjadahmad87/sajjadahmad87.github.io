import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

class Control{
  constructor(){this.value='';this.textContent='';this.listeners={};}
  addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
  dispatchEvent(event){for(const listener of this.listeners[event.type]??[])listener.call(this,event);return true;}
}

test('course filters expose and announce the controlled results',async()=>{
  const html=await readFile(new URL('../courses.html',import.meta.url),'utf8');
  assert.match(html,/id="courseSearch"[^>]+aria-controls="courseResults"/);
  assert.match(html,/id="courseSearchMobile"[^>]+aria-controls="courseResults"/);
  assert.match(html,/id="categoryFilter"[^>]+aria-controls="courseResults"/);
  assert.match(html,/id="levelFilter"[^>]+aria-controls="courseResults"/);
  assert.match(html,/id="courseCount"[^>]+role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);
  assert.match(html,/class="course-grid" id="courseResults"/);
  assert.doesNotMatch(html,/id="courseSearchMobile"[^>]+oninput=/);
  assert.match(html,/course-catalog-filters\.js\?v=20260824/);
});

test('desktop and mobile searches stay synchronized with accurate result wording',async()=>{
  const source=await readFile(new URL('../course-catalog-filters.js',import.meta.url),'utf8');
  const search=new Control(),mobileSearch=new Control(),category=new Control(),level=new Control(),count=new Control();
  const data=[['Pump maintenance','maintenance','Beginner'],['Electrical safety','electrical','Intermediate'],['Energy review','energy','Advanced']];
  const cards=data.map(([title,cat,lvl])=>({
    dataset:{title,category:cat,level:lvl},textContent:title,
    classList:{hidden:false,contains(name){return name==='hidden'&&this.hidden;},toggle(name,on){if(name==='hidden')this.hidden=on;}}
  }));
  const filter=()=>{
    const q=search.value.toLowerCase().trim();
    for(const card of cards){
      const matches=(!q||card.dataset.title.toLowerCase().includes(q))&&(!category.value||card.dataset.category===category.value)&&(!level.value||card.dataset.level===level.value);
      card.classList.toggle('hidden',!matches);
    }
  };
  search.addEventListener('input',filter);
  category.addEventListener('change',filter);
  level.addEventListener('change',filter);
  const controls={courseSearch:search,courseSearchMobile:mobileSearch,categoryFilter:category,levelFilter:level,courseCount:count};
  const document={
    querySelector(selector){return controls[selector.slice(1)]??null;},
    querySelectorAll(selector){return selector==='.course-card[data-title]'?cards:[];}
  };
  vm.runInNewContext(source,{document,Event:class Event{constructor(type){this.type=type;}}});

  assert.equal(count.textContent,'3 learning paths shown');
  search.value='pump';search.dispatchEvent({type:'input'});
  assert.equal(mobileSearch.value,'pump');
  assert.equal(count.textContent,'1 learning path shown');

  mobileSearch.value='missing';mobileSearch.dispatchEvent({type:'input'});
  assert.equal(search.value,'missing');
  assert.equal(count.textContent,'No learning paths match. Clear or change the search and filters.');

  mobileSearch.value='';mobileSearch.dispatchEvent({type:'input'});
  category.value='energy';category.dispatchEvent({type:'change'});
  assert.equal(count.textContent,'1 learning path shown');
});
