(()=>{
  const STATE_KEY='sea_lms_strategy_experiments_v1';
  const LOG_KEY='sea_lms_logbook_v1';
  const SKILLS={
    hvac:{primary:'/guides/ahu-troubleshooting/',secondary:'/guides/vfd-fundamentals/',quiz:'/course.html#knowledge-check'},
    rca:{primary:'/guides/root-cause-analysis-5-why/',secondary:'/guides/fmea-maintenance/',quiz:'/quiz-rca.html'},
    ppm:{primary:'/guides/ppm-checklist/',secondary:'/guides/preventive-maintenance/',quiz:'/quiz-ppm.html'},
    electrical:{primary:'/guides/vfd-fundamentals/',secondary:'/tools/three-phase-power-calculator/',quiz:'/quiz-electrical.html'},
    plc:{primary:'/guides/plc-troubleshooting/',secondary:'/free-video-courses.html#automation-path',quiz:'/quiz-plc.html'}
  };
  const read=(key,fallback=null)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const normalize=href=>{try{const u=new URL(href,location.origin);return u.pathname.replace(/\/+$/,'/')+(u.hash||'')}catch{return String(href||'')}};
  const taskHrefs=(skill,method)=>{
    if(method==='secondary')return [skill.secondary,null,skill.primary];
    if(method==='reflection')return [skill.quiz,null,skill.primary];
    return [null,null,skill.primary];
  };
  const saveTask=(index,source)=>{
    const state=read(STATE_KEY,{active:null,history:[]});
    if(!state.active||!Number.isInteger(index))return false;
    state.active.tasks=state.active.tasks||{};
    state.active.taskAuto=state.active.taskAuto||{};
    if(state.active.tasks[index])return false;
    state.active.tasks[index]=true;
    state.active.taskAuto[index]={source,at:new Date().toISOString()};
    write(STATE_KEY,state);
    return true;
  };
  const announce=message=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message;};
  const trackLinkedResource=anchor=>{
    const state=read(STATE_KEY,{active:null,history:[]});
    if(!state.active)return;
    const skill=SKILLS[state.active.skillId];if(!skill)return;
    const href=normalize(anchor.getAttribute('href')||anchor.href);
    const expected=taskHrefs(skill,state.active.method).map(normalize);
    const index=expected.findIndex((x,i)=>x&&x===href&&!(state.active.method==='reflection'&&i===1));
    if(index>=0&&saveTask(index,'linked-resource-opened'))announce('Study task recorded from opening the linked learning resource.');
  };
  const trackLogbookReflection=()=>{
    const state=read(STATE_KEY,{active:null,history:[]});
    if(!state.active||state.active.method!=='reflection')return;
    const started=Date.parse(state.active.startedAt||0)||0;
    const entries=read(LOG_KEY,[]);
    const hasNew=Array.isArray(entries)&&entries.some(entry=>(Date.parse(entry?.createdAt||0)||0)>=started);
    if(hasNew&&saveTask(1,'practical-logbook-entry-saved'))announce('Practical reflection task recorded from your new logbook entry.');
  };
  const loadHistoryFilter=()=>{
    if(document.querySelector('script[src="/lms-strategy-history-filter.js"]'))return;
    const script=document.createElement('script');
    script.src='/lms-strategy-history-filter.js';
    script.defer=true;
    document.body.appendChild(script);
  };
  document.addEventListener('click',event=>{
    const anchor=event.target.closest('[data-lms-strategy-outcomes] a[href]');
    if(anchor)trackLinkedResource(anchor);
  },true);
  document.addEventListener('submit',event=>{
    if(event.target.closest('[data-log-form]'))setTimeout(trackLogbookReflection,0);
  });
  document.addEventListener('DOMContentLoaded',()=>{trackLogbookReflection();loadHistoryFilter();});
  window.addEventListener('storage',event=>{if(event.key===LOG_KEY)trackLogbookReflection();});
})();
