(()=>{
  const KEY='sea_lms_role_target_v1';
  const SKILLS=[
    {key:'sea_lms_quiz_v1',name:'HVAC Troubleshooting',action:'/course.html#knowledge-check',study:'/guides/ahu-troubleshooting/'},
    {key:'sea_lms_quiz_rca_v1',name:'RCA & 5-Why',action:'/quiz-rca.html',study:'/guides/root-cause-analysis-5-why/'},
    {key:'sea_lms_quiz_ppm_v1',name:'Preventive Maintenance & PPM',action:'/quiz-ppm.html',study:'/guides/ppm-checklist/'},
    {key:'sea_lms_quiz_electrical_v1',name:'Electrical Troubleshooting',action:'/quiz-electrical.html',study:'/tools/three-phase-power-calculator/'}
  ];
  const ROLES={
    technician:{label:'Maintenance Technician',target:65,focus:['Safe, methodical inspection and fault finding','Accurate observations and maintenance records','Escalation with useful measurements and evidence'],next:'/courses.html#preventive-maintenance-ppm'},
    engineer:{label:'Maintenance Engineer',target:75,focus:['Evidence-based diagnosis and RCA','Maintenance strategy and task optimization','Cross-system electrical, HVAC and reliability reasoning'],next:'/courses.html#root-cause-analysis'},
    lead:{label:'Senior / Lead Engineer',target:85,focus:['Reliability and repeat-failure leadership','KPI, CAPEX/OPEX and risk-based prioritization','Coaching, technical review and corrective-action verification'],next:'/courses.html#engineering-management'}
  };
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const latest=s=>{const x=read(s.key),a=Array.isArray(x?.attempts)?x.attempts.filter(v=>Number(v.total)>0):[];if(!a.length)return null;const z=[...a].sort((a,b)=>new Date(b.at||b.completedAt||0)-new Date(a.at||a.completedAt||0))[0];return Math.round((Number(z.score)||0)/(Number(z.total)||1)*100)};
  const render=()=>{
    const root=document.querySelector('[data-lms-role-roadmap]');if(!root)return;
    const selected=localStorage.getItem(KEY)||'engineer',role=ROLES[selected]||ROLES.engineer;
    const rows=SKILLS.map(s=>({...s,score:latest(s)})), assessed=rows.filter(r=>r.score!==null);
    const avg=assessed.length?Math.round(assessed.reduce((n,r)=>n+r.score,0)/assessed.length):null;
    const gapRows=rows.map(r=>({...r,gap:r.score===null?null:Math.max(0,role.target-r.score)}));
    const priority=[...gapRows].filter(r=>r.score!==null).sort((a,b)=>(b.gap-a.gap)||(a.score-b.score))[0]||rows[0];
    const coverage=assessed.length+'/'+rows.length;
    root.innerHTML=`<div class="lms-item" style="margin-bottom:14px"><div class="lms-item-icon">ROLE</div><div><h3>Target pathway: ${esc(role.label)}</h3><p>${avg===null?'Complete baseline knowledge checks to compare your study coverage with this pathway.':`Latest assessed-topic average: ${avg}%. Assessment coverage: ${coverage}.`}</p></div><label style="min-width:210px"><span class="lms-local-note" style="display:block;margin-bottom:5px">Learning target</span><select data-lms-role-select aria-label="Choose learning role target" style="width:100%;padding:10px;border-radius:8px;background:#071521;color:#f3f8fb;border:1px solid rgba(145,225,255,.14)"><option value="technician" ${selected==='technician'?'selected':''}>Maintenance Technician</option><option value="engineer" ${selected==='engineer'?'selected':''}>Maintenance Engineer</option><option value="lead" ${selected==='lead'?'selected':''}>Senior / Lead Engineer</option></select></label></div>
    <div class="lms-assessment-table-wrap"><table class="lms-assessment-table"><thead><tr><th scope="col">Knowledge area</th><th scope="col">Latest</th><th scope="col">Study target</th><th scope="col">Learning action</th></tr></thead><tbody>${gapRows.map(r=>`<tr><th scope="row">${esc(r.name)}</th><td>${r.score===null?'Not assessed':r.score+'%'}</td><td>${role.target}% learning benchmark</td><td><a href="${esc(r.score===null?r.action:(r.score<role.target?r.study:r.action))}">${r.score===null?'Establish baseline':r.score<role.target?'Review topic':'Reassess / reinforce'}</a></td></tr>`).join('')}</tbody></table></div>
    <div class="lms-dashboard-grid" style="margin-top:14px"><div class="lms-item"><div class="lms-item-icon">NEXT</div><div><h3>${avg===null?'First step: establish assessment coverage':`Priority study area: ${esc(priority.name)}`}</h3><p>${avg===null?'Take the available knowledge checks so the pathway can identify evidence-based study priorities.':priority.gap>0?`Latest ${priority.score}% versus the ${role.target}% study benchmark. Review the linked material, then reassess.`:`All assessed areas currently meet this pathway’s study benchmark; reinforce the lowest-scoring assessed area and broaden learning coverage.`}</p></div><a class="btn btn-secondary" href="${esc(avg===null?priority.action:(priority.gap>0?priority.study:role.next))}">Continue learning</a></div><div class="lms-item"><div class="lms-item-icon">FOCUS</div><div><h3>${esc(role.label)} development themes</h3><p>${role.focus.map(x=>'• '+esc(x)).join('<br>')}</p></div><a class="btn btn-secondary" href="${esc(role.next)}">View related path</a></div></div>
    <p class="lms-local-note">This role map is a self-directed learning aid. The percentage target is an internal study benchmark for these four browser-local knowledge checks only; it is not a job-readiness score, formal competency assessment, certification, promotion criterion, or authorization to perform technical work. Employer competency systems, practical observation, experience, site procedures, PTW/LOTO, OEM guidance and competent-person requirements take priority.</p>`;
    root.querySelector('[data-lms-role-select]')?.addEventListener('change',e=>{localStorage.setItem(KEY,e.target.value);render()});
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
})();
