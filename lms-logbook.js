(()=>{
  const LOG_KEY='sea_lms_logbook_v1';
  const LMS_KEY='sea_lms_state_v1';
  const MAX_ENTRIES=100;
  const topics=['HVAC / AHU','RCA / 5-Why','Preventive Maintenance / PPM','Electrical Troubleshooting','PLC / Automation','Steam / Boilers','Energy / Utilities','Industrial Laundry','Reliability / FMEA','Other'];
  const activities=['Observation','Inspection','Measurement','Troubleshooting','Preventive maintenance','Improvement idea','Safety reflection','Commissioning / functional check','Other'];

  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const esc=(s)=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=(iso)=>{try{return new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return iso||'—'}};
  const getEntries=()=>{const x=read(LOG_KEY,[]);return Array.isArray(x)?x:[]};
  const saveEntries=(entries)=>write(LOG_KEY,entries.slice(0,MAX_ENTRIES));
  const announce=(message)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const addActivity=(label)=>{
    const state=read(LMS_KEY,{enrolled:{},saved:[],progress:{},activity:[]});
    state.activity=Array.isArray(state.activity)?state.activity:[];
    state.activity.unshift({type:'logbook',courseId:'',label,at:new Date().toISOString()});
    state.activity=state.activity.slice(0,40);
    state.updatedAt=new Date().toISOString();
    write(LMS_KEY,state);
  };
  const csvCell=(v)=>'"'+String(v??'').replace(/"/g,'""')+'"';

  const render=()=>{
    const host=document.querySelector('[data-lms-logbook]');
    if(!host)return;
    const entries=getEntries();
    const topicOptions=topics.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    const activityOptions=activities.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    const rows=entries.length?entries.slice(0,12).map(entry=>`<article class="lms-log-entry" data-log-id="${esc(entry.id)}"><div class="lms-log-entry-head"><div><span class="badge">${esc(entry.topic)}</span><h3>${esc(entry.title)}</h3></div><button class="lms-log-delete" type="button" data-log-delete="${esc(entry.id)}" aria-label="Delete logbook entry ${esc(entry.title)}">Delete</button></div><p class="lms-log-meta">${esc(entry.activity)}${entry.system?' · '+esc(entry.system):''} · ${esc(fmt(entry.createdAt))}</p>${entry.evidence?`<div class="lms-log-block"><strong>Evidence / observations</strong><p>${esc(entry.evidence)}</p></div>`:''}${entry.learning?`<div class="lms-log-block"><strong>Learning / reflection</strong><p>${esc(entry.learning)}</p></div>`:''}${entry.nextAction?`<div class="lms-log-block"><strong>Next action</strong><p>${esc(entry.nextAction)}</p></div>`:''}</article>`).join(''):'<div class="lms-empty">No practical learning entries yet. Record a safe, non-confidential observation, measurement, troubleshooting exercise or reflection to build your personal learning history.</div>';

    host.innerHTML=`<div class="lms-log-summary"><div><small>Local logbook entries</small><strong>${entries.length}</strong></div><div><small>Storage mode</small><strong>Browser only</strong></div><div><small>Formal competency record</small><strong>No</strong></div></div>
    <div class="lms-logbook-grid"><form class="lms-log-form" data-log-form><div class="lms-log-fields"><label>Learning topic<select name="topic" required>${topicOptions}</select></label><label>Activity type<select name="activity" required>${activityOptions}</select></label><label class="lms-log-full">Entry title<input name="title" maxlength="90" required placeholder="Example: Investigated AHU low-airflow symptom"></label><label class="lms-log-full">Asset / system (optional)<input name="system" maxlength="80" placeholder="Use a generic description; avoid confidential asset identifiers"></label><label class="lms-log-full">Evidence / observations<textarea name="evidence" maxlength="1200" rows="4" placeholder="Record measurements, symptoms, checks or observations. Do not include passwords, personal data, confidential drawings or restricted company information."></textarea></label><label class="lms-log-full">What did you learn?<textarea name="learning" maxlength="1000" rows="3" placeholder="Summarize the engineering lesson, reasoning or principle you learned."></textarea></label><label class="lms-log-full">Next learning action (optional)<textarea name="nextAction" maxlength="600" rows="2" placeholder="Example: Review VFD guide and verify fan rotation/command logic next time."></textarea></label></div><div class="lms-log-actions"><button class="btn btn-primary" type="submit">Save logbook entry</button><button class="btn btn-secondary" type="button" data-log-export-json>Export JSON</button><button class="btn btn-secondary" type="button" data-log-export-csv>Export CSV</button></div><p class="lms-local-note"><strong>Privacy:</strong> this is a personal browser-local learning log. Do not record confidential employer information, personal data, passwords, restricted drawings, proprietary settings or safety-sensitive details. Logbook entries are educational reflections only and are not formal competency evidence or authorization to perform work.</p></form><div><h3 class="lms-log-recent-title">Recent entries</h3><div class="lms-log-list">${rows}</div></div></div>`;
  };

  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-log-form]');if(!form)return;
    e.preventDefault();
    const fd=new FormData(form);
    const entry={
      id:(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)),
      topic:String(fd.get('topic')||'').trim(),
      activity:String(fd.get('activity')||'').trim(),
      title:String(fd.get('title')||'').trim(),
      system:String(fd.get('system')||'').trim(),
      evidence:String(fd.get('evidence')||'').trim(),
      learning:String(fd.get('learning')||'').trim(),
      nextAction:String(fd.get('nextAction')||'').trim(),
      createdAt:new Date().toISOString()
    };
    if(!entry.title||!entry.topic||!entry.activity)return;
    const entries=getEntries();entries.unshift(entry);saveEntries(entries);
    addActivity('Added practical learning log: '+entry.title);
    render();announce('Practical learning logbook entry saved on this browser');
  });

  document.addEventListener('click',e=>{
    const del=e.target.closest('[data-log-delete]');
    if(del){
      const id=del.dataset.logDelete;
      const entries=getEntries();const found=entries.find(x=>x.id===id);
      if(found&&confirm('Delete this browser-local logbook entry?')){
        saveEntries(entries.filter(x=>x.id!==id));
        addActivity('Deleted practical learning log: '+found.title);
        render();announce('Logbook entry deleted');
      }
      return;
    }
    if(e.target.closest('[data-log-export-json]')){
      const payload={exportedAt:new Date().toISOString(),type:'SEA practical learning logbook',entries:getEntries()};
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SEA-practical-learning-logbook.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);announce('Logbook exported as JSON');return;
    }
    if(e.target.closest('[data-log-export-csv]')){
      const entries=getEntries();const header=['Created At','Topic','Activity','Title','Asset/System','Evidence/Observations','Learning/Reflection','Next Action'];
      const lines=[header.map(csvCell).join(','),...entries.map(x=>[x.createdAt,x.topic,x.activity,x.title,x.system,x.evidence,x.learning,x.nextAction].map(csvCell).join(','))];
      const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SEA-practical-learning-logbook.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);announce('Logbook exported as CSV');
    }
  });

  document.addEventListener('DOMContentLoaded',render);
})();
