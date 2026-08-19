(()=>{
  const LMS_KEY='sea_lms_state_v1';
  const QUIZ_KEY='sea_lms_quiz_v1';
  const COURSE_ID='industrial-hvac-troubleshooting';
  const REQUIRED_MODULES=4;
  const PASS_PERCENT=80;

  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const esc=(s)=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatDate=(iso)=>{if(!iso)return '—';try{return new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return String(iso)}};

  const summary=()=>{
    const lms=read(LMS_KEY)||{};
    const progress=lms.progress?.[COURSE_ID]?.modules||{};
    const modulesDone=Object.values(progress).filter(Boolean).length;
    const quiz=read(QUIZ_KEY)||{attempts:[]};
    const attempts=(Array.isArray(quiz.attempts)?quiz.attempts:[]).filter(x=>!x.courseId||x.courseId===COURSE_ID);
    const normalized=attempts.map(x=>({score:Number(x.score)||0,total:Number(x.total)||5,at:x.at}));
    const percentages=normalized.map(x=>x.total?Math.round(x.score/x.total*100):0);
    const best=percentages.length?Math.max(...percentages):null;
    const latest=percentages.length?percentages[0]:null;
    const average=percentages.length?Math.round(percentages.reduce((a,b)=>a+b,0)/percentages.length):null;
    const passed=best!==null&&best>=PASS_PERCENT;
    const modulesComplete=modulesDone>=REQUIRED_MODULES;
    const complete=modulesComplete&&passed;
    return {modulesDone,attempts,normalized,best,latest,average,passed,modulesComplete,complete};
  };

  const statusText=(s)=>{
    if(s.complete)return 'Completion requirements met locally';
    const missing=[];
    if(!s.modulesComplete)missing.push(`${REQUIRED_MODULES-s.modulesDone} module milestone${REQUIRED_MODULES-s.modulesDone===1?'':'s'}`);
    if(!s.passed)missing.push(`knowledge-check score of ${PASS_PERCENT}% or higher`);
    return 'Still needed: '+missing.join(' and ');
  };

  const renderCourse=()=>{
    const root=document.querySelector('[data-lms-completion]');if(!root)return;
    const s=summary();
    root.innerHTML=`<div class="lms-quiz-head"><div><span class="badge">COMPLETION READINESS</span><h2>Course completion requirements</h2><p>For this browser-local learning path, completion requires all ${REQUIRED_MODULES} module milestones plus a best knowledge-check score of at least ${PASS_PERCENT}%.</p></div><div class="lms-quiz-score"><small>Status</small><strong>${s.complete?'Complete ✓':'In progress'}</strong></div></div><div class="lms-dashboard-grid" style="margin-top:14px"><div class="lms-quiz-score" style="width:100%"><small>Module milestones</small><strong>${s.modulesDone}/${REQUIRED_MODULES}</strong><small>${s.modulesComplete?'Requirement met':'Complete all four roadmap sections'}</small></div><div class="lms-quiz-score" style="width:100%"><small>Best knowledge-check score</small><strong>${s.best===null?'Not attempted':s.best+'%'}</strong><small>${s.passed?'Requirement met':`Target: ${PASS_PERCENT}%`}</small></div></div><p class="lms-local-note" style="margin-top:12px"><strong>${esc(statusText(s))}.</strong> This is a local learning-status indicator only; it is not an accredited certificate or centralized completion record.</p>`;
    const status=document.querySelector('[data-lms-course-status]');
    if(status&&s.complete)status.textContent='Completion requirements met locally';
  };

  const renderDashboard=()=>{
    const root=document.querySelector('[data-lms-completion-summary]');if(!root)return;
    const s=summary();
    const recent=s.normalized.slice(0,5);
    root.innerHTML=`<div class="lms-quiz-score" style="width:100%"><small>Completion status</small><strong>${s.complete?'Complete ✓':'In progress'}</strong><small style="margin-top:8px">Modules ${s.modulesDone}/${REQUIRED_MODULES} · Best quiz ${s.best===null?'—':s.best+'%'}</small></div><div class="lms-dashboard-grid" style="margin-top:12px"><div class="lms-quiz-score" style="width:100%"><small>Latest score</small><strong>${s.latest===null?'—':s.latest+'%'}</strong></div><div class="lms-quiz-score" style="width:100%"><small>Average score</small><strong>${s.average===null?'—':s.average+'%'}</strong></div></div><p class="lms-local-note" style="margin-top:12px">${esc(statusText(s))}. Course completion here means the browser-local requirements are met; it does not issue a certificate.</p>${recent.length?`<div class="lms-activity" style="margin-top:12px">${recent.map((x,i)=>`<div class="lms-activity-item"><strong>Attempt ${s.attempts.length-i}: ${Math.round(x.score/x.total*100)}%</strong><time datetime="${esc(x.at||'')}">${esc(formatDate(x.at))}</time></div>`).join('')}</div>`:''}`;
    document.querySelectorAll('[data-lms-quiz-average]').forEach(el=>el.textContent=s.average===null?'—':s.average+'%');
    document.querySelectorAll('[data-lms-course-complete]').forEach(el=>el.textContent=s.complete?'1':'0');
  };

  const render=()=>{renderCourse();renderDashboard()};
  document.addEventListener('DOMContentLoaded',()=>{
    render();
    document.addEventListener('change',e=>{if(e.target.matches?.('[data-lms-module]'))setTimeout(render,0)});
    document.addEventListener('submit',e=>{if(e.target.matches?.('[data-lms-quiz-form]'))setTimeout(render,20)});
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-lms-reset]'))setTimeout(render,50)});
  });
})();
