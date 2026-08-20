(()=>{
  const QUIZZES=[
    {key:'sea_lms_quiz_v1',id:'industrial-hvac-troubleshooting',name:'HVAC Troubleshooting',href:'/course.html#knowledge-check'},
    {key:'sea_lms_quiz_rca_v1',id:'root-cause-analysis',name:'RCA & 5-Why',href:'/quiz-rca.html'},
    {key:'sea_lms_quiz_ppm_v1',id:'preventive-maintenance-ppm',name:'Preventive Maintenance & PPM',href:'/quiz-ppm.html'}
  ];
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const attempts=q=>{const x=read(q.key);return Array.isArray(x?.attempts)?x.attempts.filter(a=>Number(a.total)>0):[]};
  const pct=a=>Math.round((Number(a.score)||0)/(Number(a.total)||1)*100);
  const summary=q=>{
    const a=attempts(q);if(!a.length)return {...q,attempts:0,best:null,latest:null,average:null};
    const scores=a.map(pct);return {...q,attempts:a.length,best:Math.max(...scores),latest:scores[0],average:Math.round(scores.reduce((n,x)=>n+x,0)/scores.length)};
  };
  const render=()=>{
    const root=document.querySelector('[data-lms-assessment-analytics]');if(!root)return;
    const rows=QUIZZES.map(summary),done=rows.filter(x=>x.attempts),allAttempts=done.reduce((n,x)=>n+x.attempts,0);
    const weighted=[];QUIZZES.forEach(q=>attempts(q).forEach(a=>weighted.push(pct(a))));
    const overall=weighted.length?Math.round(weighted.reduce((n,x)=>n+x,0)/weighted.length):null;
    const strongest=done.length?[...done].sort((a,b)=>b.best-a.best)[0]:null;
    const review=done.length?[...done].sort((a,b)=>(a.average??101)-(b.average??101))[0]:null;
    root.innerHTML=`<div class="lms-analytics-cards">
      <div class="dash-card"><small>Overall quiz average</small><strong>${overall===null?'—':overall+'%'}</strong></div>
      <div class="dash-card"><small>Total attempts</small><strong>${allAttempts}</strong></div>
      <div class="dash-card"><small>Strongest topic</small><strong class="lms-analytics-topic">${strongest?esc(strongest.name):'—'}</strong></div>
      <div class="dash-card"><small>Review priority</small><strong class="lms-analytics-topic">${review?esc(review.name):'—'}</strong></div>
    </div>
    <div class="lms-assessment-table-wrap"><table class="lms-assessment-table"><thead><tr><th scope="col">Knowledge check</th><th scope="col">Latest</th><th scope="col">Best</th><th scope="col">Average</th><th scope="col">Attempts</th><th scope="col">Action</th></tr></thead><tbody>${rows.map(x=>`<tr><th scope="row">${esc(x.name)}</th><td>${x.latest===null?'—':x.latest+'%'}</td><td>${x.best===null?'—':x.best+'%'}</td><td>${x.average===null?'—':x.average+'%'}</td><td>${x.attempts}</td><td><a href="${esc(x.href)}">${x.attempts?'Review / retry':'Start'}</a></td></tr>`).join('')}</tbody></table></div>
    <p class="lms-local-note">Analytics are calculated only from knowledge-check attempts stored on this browser. They are self-assessment indicators, not accredited grades or centralized competency records.</p>`;
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
})();
