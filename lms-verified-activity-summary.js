(()=>{
  const KEY='sea_lms_strategy_experiments_v1';
  const METHODS={secondary:'Different resource',reflection:'Errors + practical reflection',evidence:'Evidence-first review'};
  const SKILLS={hvac:'HVAC Troubleshooting',rca:'RCA & 5-Why',ppm:'Preventive Maintenance & PPM',electrical:'Electrical Troubleshooting'};
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const verifiedEntries=()=>{
    const state=read(KEY,{history:[]});
    const history=Array.isArray(state?.history)?state.history:[];
    const out=[];
    history.forEach(h=>{
      if(!h||h.status!=='Completed'||!h.taskAuto)return;
      Object.entries(h.taskAuto).forEach(([taskIndex,meta])=>{
        if(!h.tasks?.[taskIndex]||!meta)return;
        out.push({skillId:h.skillId,method:h.method,taskIndex:Number(taskIndex),source:meta.source||'browser-recorded-action',at:meta.at||h.completedAt||h.startedAt||null,delta:Number.isFinite(Number(h.delta))?Number(h.delta):null});
      });
    });
    return out;
  };
  const group=(rows,keyFn)=>{
    const map=new Map();
    rows.forEach(r=>{const key=keyFn(r);if(!key)return;const list=map.get(key)||[];list.push(r);map.set(key,list)});
    return [...map.entries()].map(([key,list])=>({key,count:list.length,last:list.map(x=>x.at).filter(Boolean).sort().at(-1)||null})).sort((a,b)=>b.count-a.count);
  };
  const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});};
  const render=()=>{
    const root=document.querySelector('[data-lms-verified-activity-summary]');if(!root)return;
    const rows=verifiedEntries();
    if(!rows.length){root.innerHTML='<div class="lms-empty"><strong>No verified study actions recorded yet.</strong><span>Verified actions appear here when the browser records a qualifying linked-resource open or practical-logbook reflection during a completed strategy experiment.</span></div><p class="lms-local-note">This is an activity summary only. Counts are not converted into competency, certification or job-readiness scores.</p>';return;}
    const bySkill=group(rows,r=>r.skillId);
    const byMethod=group(rows,r=>r.method);
    const resourceOpens=rows.filter(r=>r.source==='linked-resource-opened').length;
    const reflections=rows.filter(r=>r.source==='practical-logbook-entry-saved').length;
    const latest=rows.map(r=>r.at).filter(Boolean).sort().at(-1)||null;
    root.innerHTML=`<div class="dash-cards" style="margin:12px 0 18px"><div class="dash-card"><small>Verified study actions</small><strong>${rows.length}</strong></div><div class="dash-card"><small>Linked resources opened</small><strong>${resourceOpens}</strong></div><div class="dash-card"><small>Practical reflections</small><strong>${reflections}</strong></div><div class="dash-card"><small>Latest verified action</small><strong style="font-size:15px">${esc(fmtDate(latest))}</strong></div></div><div class="lms-dashboard-grid"><div><h3 style="font-size:14px">By learning area</h3><div class="lms-table-wrap"><table class="lms-table"><thead><tr><th>Learning area</th><th>Verified actions</th><th>Latest</th></tr></thead><tbody>${bySkill.map(x=>`<tr><td>${esc(SKILLS[x.key]||x.key)}</td><td>${x.count}</td><td>${esc(fmtDate(x.last))}</td></tr>`).join('')}</tbody></table></div></div><div><h3 style="font-size:14px">By study method</h3><div class="lms-table-wrap"><table class="lms-table"><thead><tr><th>Study method</th><th>Verified actions</th><th>Latest</th></tr></thead><tbody>${byMethod.map(x=>`<tr><td>${esc(METHODS[x.key]||x.key)}</td><td>${x.count}</td><td>${esc(fmtDate(x.last))}</td></tr>`).join('')}</tbody></table></div></div></div><p class="lms-local-note">“Verified” means this browser recorded the linked learning action while a strategy experiment was active. It does not independently verify workplace performance, technical competence, certification, or authorization to perform engineering work.</p>`;
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',e=>{if(e.key===KEY)render();});
  document.addEventListener('click',()=>setTimeout(render,0));
  document.addEventListener('submit',()=>setTimeout(render,0));
})();
