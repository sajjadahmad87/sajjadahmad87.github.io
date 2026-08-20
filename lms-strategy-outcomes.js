(()=>{
  const STATE_KEY='sea_lms_strategy_experiments_v1';
  const HISTORY_KEY='sea_lms_role_weekly_history_v1';
  const ROLE_KEY='sea_lms_role_target_v1';
  const SKILLS=[
    {id:'hvac',name:'HVAC Troubleshooting',quizKey:'sea_lms_quiz_v1',primary:'/guides/ahu-troubleshooting/',secondary:'/guides/vfd-fundamentals/',quiz:'/course.html#knowledge-check'},
    {id:'rca',name:'RCA & 5-Why',quizKey:'sea_lms_quiz_rca_v1',primary:'/guides/root-cause-analysis-5-why/',secondary:'/guides/fmea-maintenance/',quiz:'/quiz-rca.html'},
    {id:'ppm',name:'Preventive Maintenance & PPM',quizKey:'sea_lms_quiz_ppm_v1',primary:'/guides/ppm-checklist/',secondary:'/guides/preventive-maintenance/',quiz:'/quiz-ppm.html'},
    {id:'electrical',name:'Electrical Troubleshooting',quizKey:'sea_lms_quiz_electrical_v1',primary:'/guides/vfd-fundamentals/',secondary:'/tools/three-phase-power-calculator/',quiz:'/quiz-electrical.html'}
  ];
  const ROLES={technician:{target:65},engineer:{target:75},lead:{target:85}};
  const METHODS={
    secondary:'Use a different resource',
    reflection:'Review errors + practical reflection',
    evidence:'Evidence-first practical review'
  };
  const read=(k,f=null)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const attempts=s=>{const x=read(s.quizKey,{}),a=Array.isArray(x?.attempts)?x.attempts:[];return a.filter(v=>Number(v.total)>0).sort((a,b)=>new Date(a.at||a.completedAt||0)-new Date(b.at||b.completedAt||0));};
  const pct=a=>Math.round((Number(a?.score)||0)/(Number(a?.total)||1)*100);
  const latest=s=>{const a=attempts(s);return a.length?pct(a[a.length-1]):null;};
  const planRows=(skill,history)=>history.filter(x=>x?.skillName===skill.name&&x?.status==='Completed'&&Number.isFinite(Number(x.baseline))&&Number.isFinite(Number(x.after))).sort((a,b)=>String(a.week||'').localeCompare(String(b.week||'')));
  const stalled=(skill,history)=>{const rows=planRows(skill,history);const ds=rows.map(x=>Number(x.after)-Number(x.baseline)).slice(-2);return ds.length>=2&&ds.every(x=>x<=0);};
  const scoreClass=d=>d>0?'lms-positive':d<0?'lms-negative':'lms-neutral';
  const state=()=>{const x=read(STATE_KEY,{active:null,history:[]});x.history=Array.isArray(x.history)?x.history:[];return x;};
  const save=x=>{x.history=(x.history||[]).slice(0,8);write(STATE_KEY,x);};
  const methodSteps=(skill,method)=>{
    if(method==='secondary')return {text:'Use a different explanation/resource before reassessing.',href:skill.secondary,label:'Open alternate resource'};
    if(method==='evidence')return {text:'Review observable evidence, measurements or fault-isolation logic before reassessing.',href:skill.primary,label:'Review evidence framework'};
    return {text:'Review incorrect-answer explanations, add one non-confidential practical reflection, then reassess.',href:'/student-dashboard.html#logbook',label:'Open practical logbook'};
  };
  const completeIfReady=(x)=>{
    if(!x.active)return x;
    const skill=SKILLS.find(s=>s.id===x.active.skillId);if(!skill)return x;
    const a=attempts(skill);
    if(a.length<=Number(x.active.baselineAttempts||0))return x;
    const after=pct(a[a.length-1]),before=Number(x.active.baselineScore);
    const done={...x.active,afterScore:after,delta:after-before,completedAt:new Date().toISOString(),status:'Completed'};
    x.history.unshift(done);x.active=null;save(x);return x;
  };
  const prioritySkill=()=>{
    const history=read(HISTORY_KEY,[]),roleId=localStorage.getItem(ROLE_KEY)||'engineer',target=(ROLES[roleId]||ROLES.engineer).target;
    return SKILLS.map(s=>({s,score:latest(s),stalled:stalled(s,history)})).sort((a,b)=>Number(b.stalled)-Number(a.stalled)||((a.score??-1)-(b.score??-1)))[0]||null;
  };
  const render=()=>{
    const root=document.querySelector('[data-lms-strategy-outcomes]');if(!root)return;
    let x=completeIfReady(state());
    const priority=prioritySkill();
    const active=x.active,activeSkill=active&&SKILLS.find(s=>s.id===active.skillId);
    const latestHistory=x.history.slice(0,5);
    let activeHtml='';
    if(active&&activeSkill){
      const step=methodSteps(activeSkill,active.method);
      activeHtml=`<div class="lms-item"><div class="lms-item-icon">TEST</div><div><h3>${esc(activeSkill.name)} strategy experiment</h3><p><strong>Baseline:</strong> ${active.baselineScore}% · <strong>Method:</strong> ${esc(METHODS[active.method]||active.method)}</p><p style="margin-top:6px">${esc(step.text)} A fresh quiz attempt will close the experiment automatically and measure the change.</p></div><div class="lms-toolbar"><a class="btn btn-secondary" href="${esc(step.href)}">${esc(step.label)}</a><a class="btn btn-secondary" href="${esc(activeSkill.quiz)}">Reassess</a><button type="button" class="btn lms-danger" data-strategy-cancel>Cancel</button></div></div>`;
    }else if(priority&&priority.score!==null){
      activeHtml=`<div class="lms-item"><div class="lms-item-icon">TRY</div><div><h3>${esc(priority.s.name)}</h3><p>${priority.stalled?'Recent comparable cycles show no improvement. Test a different learning method and measure whether it works.':'Run a controlled study-method experiment when you want to compare a different learning approach.'}</p></div><div><label class="lms-local-note" for="strategyMethod">Study method</label><select id="strategyMethod" class="lms-select"><option value="secondary">Use a different resource</option><option value="reflection">Review errors + practical reflection</option><option value="evidence">Evidence-first practical review</option></select><button type="button" class="btn btn-secondary" style="margin-top:8px;width:100%" data-strategy-start="${esc(priority.s.id)}">Start experiment</button></div></div>`;
    }else{
      activeHtml='<div class="lms-empty"><strong>Take a knowledge check first.</strong><span>A saved baseline score is required before the LMS can measure whether a changed study strategy improves the reassessment result.</span></div>';
    }
    root.innerHTML=`${activeHtml}<div style="margin-top:16px"><h3 style="font-size:14px">Recent strategy outcomes</h3>${latestHistory.length?`<div class="lms-table-wrap"><table class="lms-table"><thead><tr><th>Learning area</th><th>Method</th><th>Before</th><th>After</th><th>Change</th><th>Outcome</th></tr></thead><tbody>${latestHistory.map(h=>{const d=Number(h.delta)||0;return `<tr><td>${esc(SKILLS.find(s=>s.id===h.skillId)?.name||h.skillId)}</td><td>${esc(METHODS[h.method]||h.method)}</td><td>${h.baselineScore}%</td><td>${h.afterScore}%</td><td class="${scoreClass(d)}">${d>0?'+':''}${d} pts</td><td>${d>0?'Improved':d<0?'Lower score':'No score change'}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="lms-empty"><strong>No completed strategy experiments yet.</strong><span>Completed experiments will compare the baseline and first fresh reassessment after a deliberate study-method change.</span></div>'}</div><p class="lms-local-note">These outcomes compare browser-local self-assessment scores before and after a chosen learning method. They help evaluate study approaches only; they are not evidence of professional competence, certification, job performance, or authorization to perform technical work.</p>`;
  };
  document.addEventListener('click',e=>{
    const start=e.target.closest('[data-strategy-start]');
    if(start){const skill=SKILLS.find(s=>s.id===start.dataset.strategyStart);if(!skill)return;const a=attempts(skill);if(!a.length)return;const method=document.getElementById('strategyMethod')?.value||'secondary';const x=state();x.active={skillId:skill.id,method,baselineScore:pct(a[a.length-1]),baselineAttempts:a.length,startedAt:new Date().toISOString(),status:'Active'};save(x);render();return;}
    if(e.target.closest('[data-strategy-cancel]')){const x=state();x.active=null;save(x);render();}
  });
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
  document.addEventListener('submit',e=>{if(e.target.closest('form[data-lms-quiz]'))setTimeout(render,0)});
})();
