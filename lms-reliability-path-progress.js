(()=>{
  const KEY='sea_lms_reliability_path_v1';
  const QUIZ_KEYS=['sea_lms_quiz_rca_v1','sea_lms_quiz_ppm_v1'];
  const STEPS=[
    {id:'video',label:'Studied the relevant lectures in the curated Reliability Engineering video pathway.',href:'/free-video-courses.html#reliability-path',link:'Open video pathway'},
    {id:'worksheet',label:'Defined asset boundary, failure rule, operating exposure and repair-time rule in a non-confidential worksheet.',href:'/resources/mtbf-mttr-data-collection-worksheet/',link:'Open evidence worksheet'},
    {id:'calculation',label:'Tested one documented scenario with the MTBF, MTTR and availability calculator.',href:'/tools/mtbf-mttr-availability-calculator/',link:'Open calculator'}
  ];

  const readJson=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}};
  const normalize=value=>{
    const steps={};
    if(value&&typeof value==='object'&&!Array.isArray(value)&&value.steps&&typeof value.steps==='object'&&!Array.isArray(value.steps)){
      STEPS.forEach(step=>{if(value.steps[step.id]===true)steps[step.id]=true});
    }
    return {steps,updatedAt:typeof value?.updatedAt==='string'?value.updatedAt:null};
  };
  const readState=(storage=localStorage)=>normalize(readJson(storage,KEY));
  const hasKnowledgeCheck=(storage=localStorage)=>QUIZ_KEYS.some(key=>{
    const attempts=readJson(storage,key)?.attempts;
    return Array.isArray(attempts)&&attempts.some(attempt=>Number(attempt?.total)>0);
  });
  const coverage=(state,knowledgeCheck)=>STEPS.filter(step=>state?.steps?.[step.id]===true).length+(knowledgeCheck?1:0);
  const persist=(storage,state,updatedAt=new Date().toISOString())=>{
    let before=null;
    try{before=storage.getItem(KEY);const next=JSON.stringify({steps:normalize(state).steps,updatedAt});storage.setItem(KEY,next);if(storage.getItem(KEY)!==next)throw new Error('Unverified write');return true}catch{
      try{if(before===null)storage.removeItem(KEY);else storage.setItem(KEY,before)}catch{}
      return false;
    }
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const render=()=>{
    const root=document.querySelector('[data-lms-reliability-progress]');if(!root)return;
    const state=readState(),checked=hasKnowledgeCheck(),done=coverage(state,checked),pct=Math.round(done/4*100);
    root.innerHTML=`<div class="lms-item" style="margin-bottom:14px"><div class="lms-item-icon">REL</div><div><h3>${done} of 4 study activities recorded</h3><p>${pct}% activity coverage. Learner-confirmed steps describe personal study only.</p><div class="lms-progress-bar" role="progressbar" aria-label="Reliability pathway activity coverage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="margin-top:8px"><span style="width:${pct}%"></span></div></div><a class="btn btn-secondary" href="/free-video-courses.html#reliability-path">Open pathway</a></div><div class="lms-list">${STEPS.map(step=>`<div class="lms-item"><div><label><input type="checkbox" data-reliability-step="${esc(step.id)}" ${state.steps[step.id]?'checked':''}> <strong>${esc(step.label)}</strong></label><p><a href="${esc(step.href)}">${esc(step.link)} →</a></p></div></div>`).join('')}<div class="lms-item"><div><label><input type="checkbox" ${checked?'checked':''} disabled> <strong>Completed at least one browser-recorded RCA or PPM knowledge-check attempt.</strong></label><p><a href="/quiz-rca.html">Take RCA check</a> · <a href="/quiz-ppm.html">Take PPM check</a></p></div></div></div><p class="lms-local-note">This tracker combines learner confirmation with browser-recorded assessment activity. It does not verify viewing time, practical competence, task authorization, certification or external-course completion. It is included in the portable learner backup.</p><p class="lms-local-note" data-reliability-status aria-live="polite"></p>`;
  };

  const change=event=>{
    const input=event.target.closest?.('[data-reliability-step]');if(!input)return;
    const state=readState();state.steps[input.dataset.reliabilityStep]=input.checked;
    if(!persist(localStorage,state)){
      input.checked=!input.checked;
      const status=document.querySelector('[data-reliability-status]');
      if(status){status.setAttribute('role','alert');status.textContent='This milestone could not be verified in browser storage, so the previous state was retained.'}
      return;
    }
    render();
    document.dispatchEvent(new CustomEvent('sea:reliability-progress-updated'));
  };

  document.addEventListener('change',change);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.SEALMSReliabilityProgress={normalize,readState,hasKnowledgeCheck,coverage,persist};
})();
