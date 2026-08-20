(()=>{
  const TOPICS=[
    {key:'sea_lms_quiz_v1',name:'HVAC Troubleshooting',short:'HVAC',href:'/course.html#knowledge-check'},
    {key:'sea_lms_quiz_rca_v1',name:'RCA & 5-Why',short:'RCA',href:'/quiz-rca.html'},
    {key:'sea_lms_quiz_ppm_v1',name:'Preventive Maintenance & PPM',short:'PPM',href:'/quiz-ppm.html'},
    {key:'sea_lms_quiz_electrical_v1',name:'Electrical Troubleshooting',short:'ELEC',href:'/quiz-electrical.html'}
  ];
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pct=a=>Math.round((Number(a?.score)||0)/(Number(a?.total)||1)*100);
  const attempts=t=>{const x=read(t.key);return Array.isArray(x?.attempts)?x.attempts.filter(a=>Number(a.total)>0):[]};
  const band=n=>n===null?'Not assessed':n>=90?'Strong':n>=80?'Developing well':n>=70?'Needs reinforcement':'Priority review';
  const trend=(first,latest)=>{
    if(first===null||latest===null)return {value:null,label:'—'};
    const d=latest-first;
    return {value:d,label:d>0?`+${d}%`:d<0?`${d}%`:'0%'};
  };
  const row=t=>{
    const a=attempts(t);
    if(!a.length)return {...t,count:0,first:null,latest:null,best:null,average:null,trend:trend(null,null)};
    const scores=a.map(pct);
    const chronological=[...a].sort((x,y)=>new Date(x.at||x.completedAt||0)-new Date(y.at||y.completedAt||0)).map(pct);
    const first=chronological[0],latest=chronological[chronological.length-1];
    return {...t,count:a.length,first,latest,best:Math.max(...scores),average:Math.round(scores.reduce((n,x)=>n+x,0)/scores.length),trend:trend(first,latest)};
  };
  const render=()=>{
    const root=document.querySelector('[data-lms-skills-matrix]');if(!root)return;
    const rows=TOPICS.map(row),assessed=rows.filter(x=>x.count);
    const improving=assessed.filter(x=>(x.trend.value||0)>0).length;
    const ready=assessed.filter(x=>(x.latest||0)>=80).length;
    const coverage=Math.round(assessed.length/TOPICS.length*100);
    root.innerHTML=`<div class="lms-analytics-cards">
      <div class="dash-card"><small>Skills assessed</small><strong>${assessed.length}/${TOPICS.length}</strong></div>
      <div class="dash-card"><small>Assessment coverage</small><strong>${coverage}%</strong></div>
      <div class="dash-card"><small>Topics improving</small><strong>${improving}</strong></div>
      <div class="dash-card"><small>Latest score ≥80%</small><strong>${ready}</strong></div>
    </div>
    <div class="lms-assessment-table-wrap"><table class="lms-assessment-table"><thead><tr><th scope="col">Skill area</th><th scope="col">First</th><th scope="col">Latest</th><th scope="col">Trend</th><th scope="col">Best</th><th scope="col">Average</th><th scope="col">Learning status</th><th scope="col">Action</th></tr></thead><tbody>${rows.map(x=>`<tr><th scope="row">${esc(x.name)}</th><td>${x.first===null?'—':x.first+'%'}</td><td>${x.latest===null?'—':x.latest+'%'}</td><td><strong>${esc(x.trend.label)}</strong></td><td>${x.best===null?'—':x.best+'%'}</td><td>${x.average===null?'—':x.average+'%'}</td><td>${esc(band(x.latest))}${x.latest!==null?`<div style="height:5px;background:#172c3c;border-radius:99px;overflow:hidden;margin-top:6px"><span style="display:block;height:100%;width:${Math.max(0,Math.min(100,x.latest))}%;background:linear-gradient(90deg,var(--cyan),var(--green))"></span></div>`:''}</td><td><a href="${esc(x.href)}">${x.count?'Review / reassess':'Assess'}</a></td></tr>`).join('')}</tbody></table></div>
    <p class="lms-local-note">The matrix shows learning trends from browser-local self-assessment attempts only. “First” is the earliest saved attempt and “Latest” is the most recent saved attempt. Learning-status bands are study guidance, not accredited competency grades, authorization to perform work, or centralized employer records.</p>`;
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
})();
