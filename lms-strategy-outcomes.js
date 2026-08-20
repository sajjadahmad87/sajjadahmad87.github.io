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
  const METHODS={secondary:'Use a different resource',reflection:'Review errors + practical reflection',evidence:'Evidence-first practical review'};
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
  const requestedExperiment=()=>{
    const p=new URLSearchParams(location.search),skill=p.get('strategySkill'),method=p.get('strategyMethod');
    return SKILLS.some(s=>s.id===skill)&&Object.prototype.hasOwnProperty.call(METHODS,method)?{skill,method}:null;
  };
  const methodSteps=(skill,method)=>{
    if(method==='secondary')return {text:'Use a different explanation/resource before reassessing.',href:skill.secondary,label:'Open alternate resource'};
    if(method==='evidence')return {text:'Review observable evidence, measurements or fault-isolation logic before reassessing.',href:skill.primary,label:'Review evidence framework'};
    return {text:'Review incorrect-answer explanations, add one non-confidential practical reflection, then reassess.',href:'/student-dashboard.html#logbook',label:'Open practical logbook'};
  };
  const studyTasks=(skill,method)=>{
    if(method==='secondary')return [
      {title:'Review an alternate explanation',detail:'Open the alternate resource and focus on concepts that were unclear in your previous attempt.',href:skill.secondary,label:'Open alternate resource'},
      {title:'Capture two new takeaways',detail:'Identify at least two ideas, checks, formulas or reasoning steps that differ from how you approached the topic before.'},
      {title:'Connect the new explanation to the original topic',detail:'Revisit the primary guide and check whether the alternate explanation improves your understanding of the same fault or maintenance decision.',href:skill.primary,label:'Revisit primary guide'}
    ];
    if(method==='reflection')return [
      {title:'Review your incorrect-answer explanations',detail:'Return to the latest knowledge-check feedback and identify what reasoning led to the missed answers.',href:skill.quiz,label:'Review knowledge check'},
      {title:'Add one practical reflection',detail:'Record one non-confidential workplace-style observation, measurement, troubleshooting example or maintenance lesson in the learning logbook.',href:'/student-dashboard.html#logbook',label:'Open practical logbook'},
      {title:'Verify the lesson against a structured guide',detail:'Use the primary guide to confirm what evidence or maintenance logic should support the corrected answer.',href:skill.primary,label:'Open primary guide'}
    ];
    return [
      {title:'Define the symptom or decision clearly',detail:'Write down the observable symptom, maintenance question or fault condition without jumping directly to a cause.'},
      {title:'List the evidence you would verify',detail:'Identify the measurements, observations, isolation checks or records that would distinguish one possible cause from another.'},
      {title:'Compare your evidence plan with the guide',detail:'Use the primary guide to challenge your evidence list and strengthen the fault-isolation sequence before reassessing.',href:skill.primary,label:'Review evidence framework'}
    ];
  };
  const completeIfReady=(x)=>{
    if(!x.active)return x;
    const skill=SKILLS.find(s=>s.id===x.active.skillId);if(!skill)return x;
    const a=attempts(skill);if(a.length<=Number(x.active.baselineAttempts||0))return x;
    const after=pct(a[a.length-1]),before=Number(x.active.baselineScore);
    const tasks=studyTasks(skill,x.active.method),done=tasks.filter((_,i)=>x.active.tasks?.[i]).length;
    x.history.unshift({...x.active,studyTasksCompleted:done,studyTasksTotal:tasks.length,afterScore:after,delta:after-before,completedAt:new Date().toISOString(),status:'Completed'});x.active=null;save(x);return x;
  };
  const prioritySkill=()=>{
    const history=read(HISTORY_KEY,[]),roleId=localStorage.getItem(ROLE_KEY)||'engineer',target=(ROLES[roleId]||ROLES.engineer).target;
    return SKILLS.map(s=>({s,score:latest(s),stalled:stalled(s,history)})).sort((a,b)=>Number(b.stalled)-Number(a.stalled)||((a.score??-1)-(b.score??-1)))[0]||null;
  };
  const startExperiment=(skill,method)=>{
    const a=attempts(skill);if(!a.length)return false;
    const x=state();x.active={skillId:skill.id,method,baselineScore:pct(a[a.length-1]),baselineAttempts:a.length,startedAt:new Date().toISOString(),status:'Active',tasks:{},taskAuto:{}};save(x);return true;
  };
  const provenance=(active,index)=>active.taskAuto?.[index]?'Verified action':'Manual check';
  const provenanceClass=(active,index)=>active.taskAuto?.[index]?'lms-positive':'lms-neutral';
  const taskCard=(active,skill)=>{
    const tasks=studyTasks(skill,active.method),done=tasks.filter((_,i)=>active.tasks?.[i]).length,verified=tasks.filter((_,i)=>active.tasks?.[i]&&active.taskAuto?.[i]).length;
    return `<div class="lms-item" style="margin-top:12px;align-items:start"><div class="lms-item-icon">${done}/${tasks.length}</div><div style="min-width:0"><h3>Study tasks before reassessment</h3><p>Work through these steps in order. Tasks completed by opening a linked resource or saving a qualifying logbook reflection are labelled <strong>Verified action</strong>; tasks you tick yourself are labelled <strong>Manual check</strong>.</p><div style="display:grid;gap:8px;margin-top:10px">${tasks.map((t,i)=>{const checked=!!active.tasks?.[i],source=checked?`<span class="${provenanceClass(active,i)}" style="display:inline-block;margin-top:6px;font-size:9px;font-weight:900;letter-spacing:.04em">${provenance(active,i)}</span>`:'';return `<div style="border:1px solid rgba(145,225,255,.14);border-radius:10px;padding:11px;background:rgba(255,255,255,.015)"><div style="display:flex;gap:10px;align-items:flex-start"><button type="button" class="btn btn-secondary" data-strategy-task="${i}" aria-pressed="${checked}" style="padding:8px 10px;min-width:42px">${checked?'✓':String(i+1)}</button><div><strong style="font-size:12px">${esc(t.title)}</strong><p style="margin:4px 0 0">${esc(t.detail)}</p>${t.href?`<a href="${esc(t.href)}" style="display:inline-block;margin-top:6px;color:var(--cyan);font-size:11px;font-weight:800">${esc(t.label)} →</a>`:''}${source}</div></div></div>`}).join('')}</div></div><div><strong style="font-size:16px;color:var(--cyan)">${Math.round(done/tasks.length*100)}%</strong><p class="lms-local-note" style="margin-top:4px">${verified} verified · ${Math.max(0,done-verified)} manual</p></div></div>`;
  };
  const render=()=>{
    const root=document.querySelector('[data-lms-strategy-outcomes]');if(!root)return;
    let x=completeIfReady(state());
    const req=requestedExperiment();
    const priority=req?{s:SKILLS.find(s=>s.id===req.skill),score:latest(SKILLS.find(s=>s.id===req.skill)),stalled:false}:prioritySkill();
    const active=x.active,activeSkill=active&&SKILLS.find(s=>s.id===active.skillId);
    const latestHistory=x.history.slice(0,5);
    let activeHtml='';
    if(active&&activeSkill){
      const step=methodSteps(activeSkill,active.method);
      activeHtml=`<div class="lms-item"><div class="lms-item-icon">TEST</div><div><h3>${esc(activeSkill.name)} strategy experiment</h3><p><strong>Baseline:</strong> ${active.baselineScore}% · <strong>Method:</strong> ${esc(METHODS[active.method]||active.method)}</p><p style="margin-top:6px">${esc(step.text)} A fresh quiz attempt will close the experiment automatically and measure the change.</p></div><div class="lms-toolbar"><a class="btn btn-secondary" href="${esc(step.href)}">${esc(step.label)}</a><a class="btn btn-secondary" href="${esc(activeSkill.quiz)}">Reassess</a><button type="button" class="btn lms-danger" data-strategy-cancel>Cancel</button></div></div>${taskCard(active,activeSkill)}`;
    }else if(priority&&priority.s&&priority.score!==null){
      const selected=req?.method||'secondary';
      activeHtml=`<div class="lms-item"><div class="lms-item-icon">TRY</div><div><h3>${esc(priority.s.name)}</h3><p>${req?'This experiment was preselected from your evidence-gated Strategy Insights recommendation. Review the method below, then start when ready.':priority.stalled?'Recent comparable cycles show no improvement. Test a different learning method and measure whether it works.':'Run a controlled study-method experiment when you want to compare a different learning approach.'}</p></div><div><label class="lms-local-note" for="strategyMethod">Study method</label><select id="strategyMethod" class="lms-select"><option value="secondary" ${selected==='secondary'?'selected':''}>Use a different resource</option><option value="reflection" ${selected==='reflection'?'selected':''}>Review errors + practical reflection</option><option value="evidence" ${selected==='evidence'?'selected':''}>Evidence-first practical review</option></select><button type="button" class="btn btn-secondary" style="margin-top:8px;width:100%" data-strategy-start="${esc(priority.s.id)}">Start experiment</button></div></div>`;
    }else{
      activeHtml='<div class="lms-empty"><strong>Take a knowledge check first.</strong><span>A saved baseline score is required before the LMS can measure whether a changed study strategy improves the reassessment result.</span></div>';
    }
    root.innerHTML=`${activeHtml}<div style="margin-top:16px"><h3 style="font-size:14px">Recent strategy outcomes</h3>${latestHistory.length?`<div class="lms-table-wrap"><table class="lms-table"><thead><tr><th>Learning area</th><th>Method</th><th>Study tasks</th><th>Before</th><th>After</th><th>Change</th><th>Outcome</th></tr></thead><tbody>${latestHistory.map(h=>{const d=Number(h.delta)||0,total=Number(h.studyTasksTotal),completed=Number(h.studyTasksCompleted)||0,verified=h.taskAuto?Object.keys(h.taskAuto).filter(k=>h.tasks?.[k]).length:0,taskText=Number.isFinite(total)?`${completed}/${total} (${verified} verified)`: '—';return `<tr><td>${esc(SKILLS.find(s=>s.id===h.skillId)?.name||h.skillId)}</td><td>${esc(METHODS[h.method]||h.method)}</td><td>${taskText}</td><td>${h.baselineScore}%</td><td>${h.afterScore}%</td><td class="${scoreClass(d)}">${d>0?'+':''}${d} pts</td><td>${d>0?'Improved':d<0?'Lower score':'No score change'}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="lms-empty"><strong>No completed strategy experiments yet.</strong><span>Completed experiments will compare the baseline and first fresh reassessment after a deliberate study-method change.</span></div>'}</div><p class="lms-local-note">“Verified action” means the browser recorded the linked learning action; “Manual check” means the learner marked the task complete. Neither is independent verification of workplace performance. These outcomes compare browser-local self-assessment scores only and are not evidence of professional competence, certification, job performance, or authorization to perform technical work.</p>`;
  };
  document.addEventListener('click',e=>{
    const task=e.target.closest('[data-strategy-task]');
    if(task){const x=state();if(!x.active)return;const i=Number(task.dataset.strategyTask);x.active.tasks=x.active.tasks||{};x.active.taskAuto=x.active.taskAuto||{};x.active.tasks[i]=!x.active.tasks[i];delete x.active.taskAuto[i];save(x);render();return;}
    const start=e.target.closest('[data-strategy-start]');
    if(start){const skill=SKILLS.find(s=>s.id===start.dataset.strategyStart);if(!skill)return;const method=document.getElementById('strategyMethod')?.value||'secondary';if(startExperiment(skill,method)){history.replaceState(null,'',location.pathname+location.hash);render();}return;}
    if(e.target.closest('[data-strategy-cancel]')){const x=state();x.active=null;save(x);render();}
  });
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
  document.addEventListener('submit',e=>{if(e.target.closest('form[data-lms-quiz]'))setTimeout(render,0)});
})();
