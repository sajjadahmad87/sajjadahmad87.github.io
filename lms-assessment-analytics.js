(()=>{
  const PLAN_KEY='sea_lms_personal_plan_v1';
  const PLAN_HISTORY_KEY='sea_lms_plan_history_v1';
  const QUIZZES=[
    {key:'sea_lms_quiz_v1',id:'industrial-hvac-troubleshooting',name:'HVAC Troubleshooting',href:'/course.html#knowledge-check',resourceHref:'/guides/ahu-troubleshooting/',resourceLabel:'Review AHU Troubleshooting guide',toolHref:'/guides/vfd-fundamentals/',toolLabel:'Review VFD Fundamentals'},
    {key:'sea_lms_quiz_rca_v1',id:'root-cause-analysis',name:'RCA & 5-Why',href:'/quiz-rca.html',resourceHref:'/guides/root-cause-analysis-5-why/',resourceLabel:'Review RCA & 5-Why guide',toolHref:'/guides/fmea-maintenance/',toolLabel:'Continue with FMEA'},
    {key:'sea_lms_quiz_ppm_v1',id:'preventive-maintenance-ppm',name:'Preventive Maintenance & PPM',href:'/quiz-ppm.html',resourceHref:'/guides/preventive-maintenance/',resourceLabel:'Review Preventive Maintenance strategy',toolHref:'/guides/ppm-checklist/',toolLabel:'Build a practical PPM checklist'},
    {key:'sea_lms_quiz_electrical_v1',id:'electrical-troubleshooting',name:'Electrical Troubleshooting',href:'/quiz-electrical.html',resourceHref:'/guides/vfd-fundamentals/',resourceLabel:'Review VFD Fundamentals',toolHref:'/tools/three-phase-power-calculator/',toolLabel:'Use Three-Phase Power Calculator'}
  ];
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const attempts=q=>{const x=read(q.key);return Array.isArray(x?.attempts)?x.attempts.filter(a=>Number(a.total)>0):[]};
  const pct=a=>Math.round((Number(a.score)||0)/(Number(a.total)||1)*100);
  const summary=q=>{const a=attempts(q);if(!a.length)return {...q,attempts:0,best:null,latest:null,average:null};const scores=a.map(pct);return {...q,attempts:a.length,best:Math.max(...scores),latest:scores[0],average:Math.round(scores.reduce((n,x)=>n+x,0)/scores.length)}};
  const focusFrom=rows=>{const attempted=rows.filter(x=>x.attempts);return attempted.length?[...attempted].sort((a,b)=>(a.average??101)-(b.average??101))[0]:null};
  const history=()=>{const h=read(PLAN_HISTORY_KEY);return Array.isArray(h)?h:[]};
  const getPlan=rows=>{
    const focus=focusFrom(rows);if(!focus)return null;
    let plan=read(PLAN_KEY);
    if(!plan||!QUIZZES.some(q=>q.id===plan.focusId)){
      plan={focusId:focus.id,createdAt:new Date().toISOString(),baselineAttempts:focus.attempts,baselineAverage:focus.average,visited:{resource:false,tool:false}};write(PLAN_KEY,plan);
    }
    const q=rows.find(x=>x.id===plan.focusId)||focus;
    const retaken=q.attempts>Number(plan.baselineAttempts||0);
    const completed=!!plan.visited?.resource&&!!plan.visited?.tool&&retaken;
    if(completed&&!plan.completedAt){plan.completedAt=new Date().toISOString();plan.outcomeAverage=q.average;plan.improvement=(Number(q.average)||0)-(Number(plan.baselineAverage)||0);write(PLAN_KEY,plan)}
    return {plan,q,retaken,completed};
  };
  const archivePlan=(plan,q)=>{
    const h=history();
    const record={focusId:plan.focusId,topic:q.name,createdAt:plan.createdAt,completedAt:plan.completedAt||new Date().toISOString(),baselineAverage:Number(plan.baselineAverage)||0,outcomeAverage:Number(plan.outcomeAverage??q.average)||0,improvement:Number(plan.improvement??((Number(q.average)||0)-(Number(plan.baselineAverage)||0)))};
    h.unshift(record);write(PLAN_HISTORY_KEY,h.slice(0,12));
  };
  const renderHistory=()=>{
    const h=history();if(!h.length)return '';
    const rows=h.slice(0,5).map(x=>{const delta=Number(x.improvement)||0;const deltaLabel=delta>0?`+${delta}%`:delta<0?`${delta}%`:'0%';const date=x.completedAt?new Date(x.completedAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'—';return `<tr><th scope="row">${esc(x.topic||x.focusId)}</th><td>${Number(x.baselineAverage)||0}%</td><td>${Number(x.outcomeAverage)||0}%</td><td><strong>${esc(deltaLabel)}</strong></td><td>${esc(date)}</td></tr>`}).join('');
    return `<div class="lms-assessment-table-wrap" style="margin-top:16px"><table class="lms-assessment-table"><caption style="text-align:left;padding:0 0 10px;font-weight:800">Completed learning-plan outcomes</caption><thead><tr><th scope="col">Topic</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Change</th><th scope="col">Completed</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };
  const recommendation=rows=>{
    const attempted=rows.filter(x=>x.attempts);
    if(!attempted.length)return `<div class="lms-item" style="margin-top:16px"><div class="lms-item-icon">NEXT</div><div><h3>Start with a baseline knowledge check</h3><p>Complete any knowledge check first. Assessment analytics will then build a personalized three-step learning plan from your saved results.</p></div><a class="btn btn-secondary" href="/quiz-electrical.html">Start assessment</a></div>`;
    const p=getPlan(rows),q=p.q,plan=p.plan;
    const reason=(q.average??0)>=80?'Your assessed topics are performing well. This plan reinforces the lowest current average before you move on.':`Your current average in this topic is ${q.average}%, making it the clearest review priority from your saved assessments.`;
    const status=x=>x?'✓ Complete':'○ Pending';
    const doneCount=[plan.visited?.resource,plan.visited?.tool,p.retaken].filter(Boolean).length;
    const outcome=p.completed?`<p><strong>Measured outcome:</strong> ${Number(plan.baselineAverage)||0}% before → ${Number(plan.outcomeAverage??q.average)||0}% after (${(Number(plan.improvement)||0)>0?'+':''}${Number(plan.improvement)||0}%).</p>`:'';
    return `<div class="lms-item" style="margin-top:16px"><div class="lms-item-icon">PLAN</div><div style="min-width:0"><h3>Personal learning plan: ${esc(q.name)}</h3><p>${esc(reason)}</p><p><strong>${doneCount}/3 activities complete</strong>${p.completed?' — Plan complete':''}</p>${outcome}<div class="lms-quiz-actions" style="display:grid;gap:8px">
      <a href="${esc(q.resourceHref)}" data-plan-step="resource"><strong>1. ${esc(q.resourceLabel)}</strong><span style="display:block">${status(plan.visited?.resource)}</span></a>
      <a href="${esc(q.toolHref)}" data-plan-step="tool"><strong>2. ${esc(q.toolLabel)}</strong><span style="display:block">${status(plan.visited?.tool)}</span></a>
      <a href="${esc(q.href)}"><strong>3. Reassess ${esc(q.name)}</strong><span style="display:block">${status(p.retaken)}</span></a>
    </div></div>${p.completed?'<button class="btn btn-secondary" type="button" data-plan-next>Archive & build next plan</button>':`<a class="btn btn-secondary" href="${esc(q.href)}">Continue plan</a>`}</div>`;
  };
  const bindPlanActions=(root,rows)=>{
    root.querySelectorAll('[data-plan-step]').forEach(a=>a.addEventListener('click',()=>{const plan=read(PLAN_KEY);if(!plan)return;plan.visited=plan.visited||{};plan.visited[a.dataset.planStep]=true;plan.updatedAt=new Date().toISOString();write(PLAN_KEY,plan)}));
    root.querySelector('[data-plan-next]')?.addEventListener('click',()=>{const plan=read(PLAN_KEY);if(plan){const q=rows.find(x=>x.id===plan.focusId);if(q)archivePlan(plan,q)}localStorage.removeItem(PLAN_KEY);render()});
  };
  const render=()=>{
    const root=document.querySelector('[data-lms-assessment-analytics]');if(!root)return;
    const rows=QUIZZES.map(summary),done=rows.filter(x=>x.attempts),allAttempts=done.reduce((n,x)=>n+x.attempts,0);
    const weighted=[];QUIZZES.forEach(q=>attempts(q).forEach(a=>weighted.push(pct(a))));
    const overall=weighted.length?Math.round(weighted.reduce((n,x)=>n+x,0)/weighted.length):null;
    const strongest=done.length?[...done].sort((a,b)=>b.best-a.best)[0]:null;
    const review=focusFrom(rows);
    root.innerHTML=`<div class="lms-analytics-cards">
      <div class="dash-card"><small>Overall quiz average</small><strong>${overall===null?'—':overall+'%'}</strong></div>
      <div class="dash-card"><small>Total attempts</small><strong>${allAttempts}</strong></div>
      <div class="dash-card"><small>Strongest topic</small><strong class="lms-analytics-topic">${strongest?esc(strongest.name):'—'}</strong></div>
      <div class="dash-card"><small>Review priority</small><strong class="lms-analytics-topic">${review?esc(review.name):'—'}</strong></div>
    </div>
    <div class="lms-assessment-table-wrap"><table class="lms-assessment-table"><thead><tr><th scope="col">Knowledge check</th><th scope="col">Latest</th><th scope="col">Best</th><th scope="col">Average</th><th scope="col">Attempts</th><th scope="col">Action</th></tr></thead><tbody>${rows.map(x=>`<tr><th scope="row">${esc(x.name)}</th><td>${x.latest===null?'—':x.latest+'%'}</td><td>${x.best===null?'—':x.best+'%'}</td><td>${x.average===null?'—':x.average+'%'}</td><td>${x.attempts}</td><td><a href="${esc(x.href)}">${x.attempts?'Review / retry':'Start'}</a></td></tr>`).join('')}</tbody></table></div>
    ${recommendation(rows)}${renderHistory()}
    <p class="lms-local-note">Analytics, plans and outcome history are calculated only from knowledge-check attempts and study actions stored on this browser. “Before” is the topic average when a plan was created; “After” is the topic average after the required reassessment. These are self-assessment learning aids, not accredited grades, competency decisions or centralized learner records.</p>`;
    bindPlanActions(root,rows);
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
})();
