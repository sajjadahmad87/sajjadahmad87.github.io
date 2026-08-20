(()=>{
  const HISTORY_KEY='sea_lms_role_weekly_history_v1';
  const SKILLS=['HVAC Troubleshooting','RCA & 5-Why','Preventive Maintenance & PPM','Electrical Troubleshooting'];
  const read=(k,f=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return Array.isArray(v)?v:f}catch{return f}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const score=v=>v===null||v===undefined||!Number.isFinite(Number(v))?null:Number(v);
  const fmt=v=>v===null?'—':Math.round(v)+'%';
  const delta=v=>v===null?'No comparable reassessment':`${v>0?'+':''}${Math.round(v)} pts`;

  const summarize=(history)=>{
    const ordered=[...history].sort((a,b)=>String(a.week||'').localeCompare(String(b.week||'')));
    const completed=ordered.filter(x=>x.status==='Completed');
    const comparable=completed.filter(x=>score(x.baseline)!==null&&score(x.after)!==null);
    const deltas=comparable.map(x=>score(x.after)-score(x.baseline));
    const averageDelta=deltas.length?deltas.reduce((a,b)=>a+b,0)/deltas.length:null;
    const improved=deltas.filter(x=>x>0).length;
    const unchanged=deltas.filter(x=>x===0).length;
    const declined=deltas.filter(x=>x<0).length;
    const priorityCounts={};
    ordered.forEach(x=>{if(x.skillName)priorityCounts[x.skillName]=(priorityCounts[x.skillName]||0)+1});
    const repeated=Object.entries(priorityCounts).sort((a,b)=>b[1]-a[1]);
    const top=repeated[0]||null;
    return {ordered,completed,comparable,averageDelta,improved,unchanged,declined,priorityCounts,top};
  };

  const skillRow=(name,history)=>{
    const rows=history.filter(x=>x.skillName===name).sort((a,b)=>String(a.week||'').localeCompare(String(b.week||'')));
    const comparable=rows.filter(x=>score(x.baseline)!==null&&score(x.after)!==null);
    const first=comparable.length?score(comparable[0].baseline):null;
    const latest=comparable.length?score(comparable[comparable.length-1].after):null;
    const movement=first!==null&&latest!==null?latest-first:null;
    const completed=rows.filter(x=>x.status==='Completed').length;
    return {name,plans:rows.length,completed,first,latest,movement};
  };

  const trajectory=(history)=>{
    const rows=history.filter(x=>x.status==='Completed'&&score(x.baseline)!==null&&score(x.after)!==null).sort((a,b)=>String(a.week||'').localeCompare(String(b.week||''))).slice(-6);
    if(!rows.length)return '<div class="lms-empty">Complete and archive weekly role-development plans to build a multi-week score trajectory.</div>';
    return `<div class="lms-list">${rows.map(x=>{const b=score(x.baseline),a=score(x.after),d=a-b;return `<div class="lms-item"><div class="lms-item-icon">${esc(String(x.week||'').slice(5))}</div><div><h3>${esc(x.skillName||'Weekly plan')}</h3><p>${fmt(b)} → ${fmt(a)} · ${esc(delta(d))} · ${esc(x.roleLabel||'Role target')}</p><div class="lms-course-progress" style="margin-top:8px"><div class="lms-progress-bar"><span style="width:${Math.max(0,Math.min(100,a))}%"></span></div></div></div></div>`}).join('')}</div>`;
  };

  const render=()=>{
    const root=document.querySelector('[data-lms-weekly-trends]');
    if(!root)return;
    const history=read(HISTORY_KEY,[]);
    if(!history.length){root.innerHTML='<div class="lms-empty">No archived weekly role-development plans yet. Finish or refresh weekly plans to start building a multi-week trend.</div><p class="lms-local-note">Trend data stays on this browser and is a self-development indicator only.</p>';return;}
    const s=summarize(history);
    const skillRows=SKILLS.map(name=>skillRow(name,history));
    const topText=s.top?`${s.top[0]} (${s.top[1]} plan${s.top[1]===1?'':'s'})`:'No repeated priority yet';
    const trendLabel=s.averageDelta===null?'Not enough comparable plans':s.averageDelta>0?'Improving overall':s.averageDelta<0?'Needs review':'Stable overall';
    root.innerHTML=`
      <div class="dash-cards" style="margin-bottom:16px">
        <div class="dash-card"><small>Archived weeks</small><strong>${history.length}</strong></div>
        <div class="dash-card"><small>Completed cycles</small><strong>${s.completed.length}</strong></div>
        <div class="dash-card"><small>Average score change</small><strong>${s.averageDelta===null?'—':`${s.averageDelta>0?'+':''}${Math.round(s.averageDelta)} pts`}</strong></div>
        <div class="dash-card"><small>Improved cycles</small><strong>${s.improved}</strong></div>
      </div>
      <div class="lms-item" style="margin-bottom:14px"><div class="lms-item-icon">TREND</div><div><h3>${esc(trendLabel)}</h3><p>Most repeated development priority: <strong>${esc(topText)}</strong>. Comparable completed cycles: ${s.comparable.length} · Improved ${s.improved} · Stable ${s.unchanged} · Lower reassessment ${s.declined}.</p></div></div>
      <div class="lms-table-wrap"><table class="lms-table"><thead><tr><th>Learning area</th><th>Weekly plans</th><th>Completed</th><th>First baseline</th><th>Latest reassessment</th><th>Multi-week movement</th></tr></thead><tbody>${skillRows.map(r=>`<tr><td><strong>${esc(r.name)}</strong></td><td>${r.plans}</td><td>${r.completed}</td><td>${fmt(r.first)}</td><td>${fmt(r.latest)}</td><td>${r.movement===null?'—':esc(delta(r.movement))}</td></tr>`).join('')}</tbody></table></div>
      <h3 style="margin:20px 0 10px">Recent completed-plan trajectory</h3>
      ${trajectory(history)}
      <p class="lms-local-note">These trends summarize browser-local self-assessment and study-plan history. They are not competency certification, employer performance evidence, promotion criteria, or authorization to perform technical work.</p>`;
  };

  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
  document.addEventListener('click',e=>{if(e.target.closest('[data-role-plan-refresh]'))setTimeout(render,0)});
  document.addEventListener('submit',e=>{if(e.target.closest('form[data-lms-quiz]'))setTimeout(render,0)});
})();
