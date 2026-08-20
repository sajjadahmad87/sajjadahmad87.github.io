(()=>{
  const KEY='sea_lms_role_target_v1';
  const LOG_KEY='sea_lms_logbook_v1';
  const SKILLS=[
    {key:'sea_lms_quiz_v1',name:'HVAC Troubleshooting',logTopic:'HVAC / AHU',action:'/course.html#knowledge-check',study:'/guides/ahu-troubleshooting/'},
    {key:'sea_lms_quiz_rca_v1',name:'RCA & 5-Why',logTopic:'RCA / 5-Why',action:'/quiz-rca.html',study:'/guides/root-cause-analysis-5-why/'},
    {key:'sea_lms_quiz_ppm_v1',name:'Preventive Maintenance & PPM',logTopic:'Preventive Maintenance / PPM',action:'/quiz-ppm.html',study:'/guides/ppm-checklist/'},
    {key:'sea_lms_quiz_electrical_v1',name:'Electrical Troubleshooting',logTopic:'Electrical Troubleshooting',action:'/quiz-electrical.html',study:'/tools/three-phase-power-calculator/'}
  ];
  const ROLES={
    technician:{label:'Maintenance Technician',target:65,focus:['Safe, methodical inspection and fault finding','Accurate observations and maintenance records','Escalation with useful measurements and evidence'],next:'/courses.html#preventive-maintenance-ppm'},
    engineer:{label:'Maintenance Engineer',target:75,focus:['Evidence-based diagnosis and RCA','Maintenance strategy and task optimization','Cross-system electrical, HVAC and reliability reasoning'],next:'/courses.html#root-cause-analysis'},
    lead:{label:'Senior / Lead Engineer',target:85,focus:['Reliability and repeat-failure leadership','KPI, CAPEX/OPEX and risk-based prioritization','Coaching, technical review and corrective-action verification'],next:'/courses.html#engineering-management'}
  };
  const read=(k,fallback=null)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??fallback}catch{return fallback}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const latest=s=>{const x=read(s.key,{}),a=Array.isArray(x?.attempts)?x.attempts.filter(v=>Number(v.total)>0):[];if(!a.length)return null;const z=[...a].sort((a,b)=>new Date(b.at||b.completedAt||0)-new Date(a.at||a.completedAt||0))[0];return Math.round((Number(z.score)||0)/(Number(z.total)||1)*100)};
  const practicalCounts=()=>{const logs=read(LOG_KEY,[]);return Array.isArray(logs)?logs:[]};
  const nextAction=(r,role)=>{
    if(r.score===null)return {href:r.action,label:'Establish baseline'};
    if(r.score<role.target)return {href:r.study,label:'Review topic'};
    if(!r.logs)return {href:'/student-dashboard.html#logbook',label:'Add practical reflection'};
    return {href:r.action,label:'Reassess / reinforce'};
  };
  const render=()=>{
    const root=document.querySelector('[data-lms-role-roadmap]');if(!root)return;
    const selected=localStorage.getItem(KEY)||'engineer',role=ROLES[selected]||ROLES.engineer,logs=practicalCounts();
    const rows=SKILLS.map(s=>({...s,score:latest(s),logs:logs.filter(x=>x?.topic===s.logTopic).length})),assessed=rows.filter(r=>r.score!==null);
    const avg=assessed.length?Math.round(assessed.reduce((n,r)=>n+r.score,0)/assessed.length):null;
    const gapRows=rows.map(r=>({...r,gap:r.score===null?null:Math.max(0,role.target-r.score),actionState:nextAction(r,role)}));
    const priority=[...gapRows].sort((a,b)=>{
      const aNeed=a.score===null?3:(a.gap>0?2:(!a.logs?1:0));
      const bNeed=b.score===null?3:(b.gap>0?2:(!b.logs?1:0));
      return (bNeed-aNeed)||((b.gap||0)-(a.gap||0))||((a.score??-1)-(b.score??-1));
    })[0]||rows[0];
    const coverage=assessed.length+'/'+rows.length,practicalAreas=rows.filter(r=>r.logs).length,balanced=rows.filter(r=>r.score!==null&&r.logs).length;
    const priorityText=priority.score===null?'Establish a baseline knowledge check before choosing a study gap.':priority.gap>0?`Latest ${priority.score}% versus the ${role.target}% study benchmark. Review the linked material, then reassess.`:!priority.logs?'Knowledge self-check currently meets the study benchmark, but no practical reflection is logged for this area. Add a non-confidential learning reflection to broaden coverage.':'Knowledge self-check and practical reflection are both present. Reassess or broaden into the next role-development theme.';
    root.innerHTML=`<div class="lms-item" style="margin-bottom:14px"><div class="lms-item-icon">ROLE</div><div><h3>Target pathway: ${esc(role.label)}</h3><p>${avg===null?'Complete baseline knowledge checks to compare your study coverage with this pathway.':`Latest assessed-topic average: ${avg}%. Assessment coverage: ${coverage}. Practical reflection coverage: ${practicalAreas}/${rows.length}. Balanced knowledge + reflection areas: ${balanced}/${rows.length}.`}</p></div><label style="min-width:210px"><span class="lms-local-note" style="display:block;margin-bottom:5px">Learning target</span><select data-lms-role-select aria-label="Choose learning role target" style="width:100%;padding:10px;border-radius:8px;background:#071521;color:#f3f8fb;border:1px solid rgba(145,225,255,.14)"><option value="technician" ${selected==='technician'?'selected':''}>Maintenance Technician</option><option value="engineer" ${selected==='engineer'?'selected':''}>Maintenance Engineer</option><option value="lead" ${selected==='lead'?'selected':''}>Senior / Lead Engineer</option></select></label></div>
    <div class="lms-assessment-table-wrap"><table class="lms-assessment-table"><thead><tr><th scope="col">Learning area</th><th scope="col">Latest self-check</th><th scope="col">Practical reflection</th><th scope="col">Study target</th><th scope="col">Learning action</th></tr></thead><tbody>${gapRows.map(r=>`<tr><th scope="row">${esc(r.name)}</th><td>${r.score===null?'Not assessed':r.score+'%'}</td><td>${r.logs?r.logs+' log entr'+(r.logs===1?'y':'ies'):'None yet'}</td><td>${role.target}% learning benchmark</td><td><a href="${esc(r.actionState.href)}">${esc(r.actionState.label)}</a></td></tr>`).join('')}</tbody></table></div>
    <div class="lms-dashboard-grid" style="margin-top:14px"><div class="lms-item"><div class="lms-item-icon">NEXT</div><div><h3>Priority development area: ${esc(priority.name)}</h3><p>${esc(priorityText)}</p></div><a class="btn btn-secondary" href="${esc(priority.actionState?.href||priority.action)}">Continue learning</a></div><div class="lms-item"><div class="lms-item-icon">FOCUS</div><div><h3>${esc(role.label)} development themes</h3><p>${role.focus.map(x=>'• '+esc(x)).join('<br>')}</p></div><a class="btn btn-secondary" href="${esc(role.next)}">View related path</a></div></div>
    <p class="lms-local-note">This role map combines browser-local knowledge self-checks with the learner's own non-confidential practical reflections to show study coverage. Assessment percentages remain internal learning benchmarks only, and practical-entry counts are never converted into a competency score. This is not a job-readiness score, formal competency assessment, employer evidence record, certification, promotion criterion, or authorization to perform technical work. Employer competency systems, practical observation, experience, site procedures, PTW/LOTO, OEM guidance and competent-person requirements take priority.</p>`;
    root.querySelector('[data-lms-role-select]')?.addEventListener('change',e=>{localStorage.setItem(KEY,e.target.value);render()});
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
  document.addEventListener('submit',e=>{if(e.target.closest('[data-log-form]'))setTimeout(render,0)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-log-delete]'))setTimeout(render,0)});
})();
