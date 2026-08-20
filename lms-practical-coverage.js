(()=>{
  const LOG_KEY='sea_lms_logbook_v1';
  const AREAS=[
    {name:'HVAC Troubleshooting',logTopic:'HVAC / AHU',quizKey:'sea_lms_quiz_v1',quizHref:'/course.html#knowledge-check',studyHref:'/guides/ahu-troubleshooting/'},
    {name:'RCA & 5-Why',logTopic:'RCA / 5-Why',quizKey:'sea_lms_quiz_rca_v1',quizHref:'/quiz-rca.html',studyHref:'/guides/root-cause-analysis-5-why/'},
    {name:'Preventive Maintenance / PPM',logTopic:'Preventive Maintenance / PPM',quizKey:'sea_lms_quiz_ppm_v1',quizHref:'/quiz-ppm.html',studyHref:'/guides/ppm-checklist/'},
    {name:'Electrical Troubleshooting',logTopic:'Electrical Troubleshooting',quizKey:'sea_lms_quiz_electrical_v1',quizHref:'/quiz-electrical.html',studyHref:'/tools/three-phase-power-calculator/'}
  ];
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch{return fallback}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const fmt=iso=>{try{return new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(new Date(iso))}catch{return '—'}};
  const score=a=>Math.round((Number(a?.score)||0)/(Number(a?.total)||1)*100);
  const quizInfo=key=>{
    const data=read(key,{}),attempts=Array.isArray(data?.attempts)?data.attempts.filter(a=>Number(a.total)>0):[];
    if(!attempts.length)return {count:0,latest:null,best:null};
    const ordered=[...attempts].sort((a,b)=>new Date(a.at||a.completedAt||0)-new Date(b.at||b.completedAt||0));
    return {count:attempts.length,latest:score(ordered[ordered.length-1]),best:Math.max(...attempts.map(score))};
  };
  const coverageLabel=(quizCount,logs)=>{
    if(quizCount&&logs>=2)return 'Knowledge + practical reflection';
    if(quizCount&&logs===1)return 'Knowledge checked + first practical entry';
    if(quizCount)return 'Knowledge checked; add practical reflection';
    if(logs)return 'Practical reflection logged; add knowledge check';
    return 'Start learning evidence';
  };
  const nextAction=(area,q,logs)=>{
    if(!q.count)return {href:area.quizHref,label:'Take knowledge check'};
    if(!logs)return {href:'#logbook',label:'Add practical log'};
    if(q.latest!==null&&q.latest<80)return {href:area.studyHref,label:'Review study resource'};
    return {href:area.studyHref,label:'Reinforce topic'};
  };
  const render=()=>{
    const root=document.querySelector('[data-lms-practical-coverage]');if(!root)return;
    const allLogs=read(LOG_KEY,[]),logs=Array.isArray(allLogs)?allLogs:[];
    const rows=AREAS.map(area=>{
      const topicLogs=logs.filter(x=>x?.topic===area.logTopic),q=quizInfo(area.quizKey),last=topicLogs[0]||null;
      return {...area,q,logs:topicLogs.length,last,action:nextAction(area,q,topicLogs.length)};
    });
    const withQuiz=rows.filter(x=>x.q.count).length,withPractice=rows.filter(x=>x.logs).length,balanced=rows.filter(x=>x.q.count&&x.logs).length,totalLogs=rows.reduce((n,x)=>n+x.logs,0);
    root.innerHTML=`<div class="lms-analytics-cards"><div class="dash-card"><small>Knowledge areas assessed</small><strong>${withQuiz}/${AREAS.length}</strong></div><div class="dash-card"><small>Areas with practical logs</small><strong>${withPractice}/${AREAS.length}</strong></div><div class="dash-card"><small>Balanced areas</small><strong>${balanced}/${AREAS.length}</strong></div><div class="dash-card"><small>Core-topic log entries</small><strong>${totalLogs}</strong></div></div>
    <div class="lms-assessment-table-wrap"><table class="lms-assessment-table"><thead><tr><th scope="col">Learning area</th><th scope="col">Latest self-check</th><th scope="col">Practical entries</th><th scope="col">Latest practical reflection</th><th scope="col">Coverage</th><th scope="col">Next action</th></tr></thead><tbody>${rows.map(x=>`<tr><th scope="row">${esc(x.name)}</th><td>${x.q.latest===null?'Not assessed':x.q.latest+'%'}${x.q.count?`<small style="display:block;color:var(--muted)">${x.q.count} attempt${x.q.count===1?'':'s'} · best ${x.q.best}%</small>`:''}</td><td>${x.logs}</td><td>${x.last?esc(fmt(x.last.createdAt)):'—'}</td><td>${esc(coverageLabel(x.q.count,x.logs))}</td><td><a href="${esc(x.action.href)}">${esc(x.action.label)}</a></td></tr>`).join('')}</tbody></table></div>
    <p class="lms-local-note">This view connects browser-local self-assessment activity with the learner's own non-confidential practical reflections. It shows learning coverage only; it is not a formal competency assessment, employer evidence record, certification, or authorization to perform engineering work. Entry counts are not converted into a competency score.</p>`;
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
  document.addEventListener('submit',e=>{if(e.target.closest('[data-log-form]'))setTimeout(render,0)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-log-delete]'))setTimeout(render,0)});
})();
