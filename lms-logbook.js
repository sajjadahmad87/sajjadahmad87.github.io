(()=>{
  const LOG_KEY='sea_lms_logbook_v1';
  const LMS_KEY='sea_lms_state_v1';
  const MAX_ENTRIES=100;
  let showAllEntries=false;
  let logbookQuery='';
  let logbookTopic='all';
  const topics=['HVAC / AHU','RCA / 5-Why','Preventive Maintenance / PPM','Electrical Troubleshooting','PLC / Automation','Steam / Boilers','Energy / Utilities','Industrial Laundry','Reliability / FMEA','Other'];
  const activities=['Observation','Inspection','Measurement','Troubleshooting','Preventive maintenance','Improvement idea','Safety reflection','Commissioning / functional check','Other'];

  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const esc=(s)=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=(iso)=>{try{return new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return iso||'—'}};
  const getEntries=()=>{const x=read(LOG_KEY,[]);return Array.isArray(x)?x:[]};
  const filterEntries=(entries)=>{
    const query=logbookQuery.trim().toLowerCase();
    return entries.filter(entry=>(logbookTopic==='all'||entry.topic===logbookTopic)&&(!query||[entry.title,entry.topic,entry.activity,entry.system,entry.evidence,entry.learning,entry.nextAction].some(value=>String(value||'').toLowerCase().includes(query))));
  };
  const saveEntries=(entries)=>write(LOG_KEY,entries.slice(0,MAX_ENTRIES));
  const announce=(message)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const focusElement=(element)=>{if(!element)return;requestAnimationFrame(()=>{try{element.focus({preventScroll:true})}catch{element.focus()}})};
  const focusDelete=(id)=>focusElement([...document.querySelectorAll('[data-log-delete]')].find(button=>button.dataset.logDelete===id));
  const focusEdit=(id)=>focusElement([...document.querySelectorAll('[data-log-edit]')].find(button=>button.dataset.logEdit===id)||document.querySelector('[data-log-form] [name="title"]'));
  const focusSearch=()=>{const input=document.querySelector('[data-log-search]');if(!input)return;const end=input.value.length;requestAnimationFrame(()=>{try{input.focus({preventScroll:true})}catch{input.focus()}input.setSelectionRange(end,end)})};
  const addActivity=(label)=>{
    const state=read(LMS_KEY,{enrolled:{},saved:[],progress:{},activity:[]});
    state.activity=Array.isArray(state.activity)?state.activity:[];
    state.activity.unshift({type:'logbook',courseId:'',label,at:new Date().toISOString()});
    state.activity=state.activity.slice(0,40);
    state.updatedAt=new Date().toISOString();
    write(LMS_KEY,state);
  };
  const csvCell=(v)=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const validDate=(value)=>typeof value==='string'&&value.length<=40&&Number.isFinite(Date.parse(value));
  const validateImport=(payload)=>{
    if(!payload||payload.type!=='SEA practical learning logbook'||!Array.isArray(payload.entries))throw new Error('Choose a compatible SEA Practical Logbook JSON export.');
    if(!payload.entries.length||payload.entries.length>MAX_ENTRIES)throw new Error('The backup must contain between 1 and '+MAX_ENTRIES+' entries.');
    const ids=new Set();
    return payload.entries.map((entry,index)=>{
      if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error('Entry '+(index+1)+' is not valid.');
      const required={id:200,topic:80,activity:80,title:90};
      for(const [name,max] of Object.entries(required))if(typeof entry[name]!=='string'||!entry[name].trim()||entry[name].length>max)throw new Error('Entry '+(index+1)+' has an invalid '+name+'.');
      if(ids.has(entry.id))throw new Error('The backup contains duplicate entry IDs.');ids.add(entry.id);
      if(!validDate(entry.createdAt)||(entry.updatedAt&&!validDate(entry.updatedAt)))throw new Error('Entry '+(index+1)+' has an invalid timestamp.');
      const optional={system:80,evidence:1200,learning:1000,nextAction:600};
      for(const [name,max] of Object.entries(optional))if(entry[name]!=null&&(typeof entry[name]!=='string'||entry[name].length>max))throw new Error('Entry '+(index+1)+' has an invalid '+name+'.');
      return {id:entry.id,topic:entry.topic.trim(),activity:entry.activity.trim(),title:entry.title.trim(),system:String(entry.system||'').trim(),evidence:String(entry.evidence||'').trim(),learning:String(entry.learning||'').trim(),nextAction:String(entry.nextAction||'').trim(),createdAt:entry.createdAt,...(entry.updatedAt?{updatedAt:entry.updatedAt}:{})};
    });
  };
  const download=(content,type,filename,successMessage)=>{
    let url='';
    try{
      const blob=new Blob([content],{type});
      url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=filename;a.hidden=true;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);announce(successMessage);
    }catch{
      if(url)URL.revokeObjectURL(url);
      announce('Logbook export could not start. Please try again or use another browser.');
    }
  };

  const render=()=>{
    const host=document.querySelector('[data-lms-logbook]');
    if(!host)return;
    const entries=getEntries();
    const topicOptions=topics.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    const activityOptions=activities.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    const filteredEntries=filterEntries(entries);
    const visibleEntries=showAllEntries?filteredEntries:filteredEntries.slice(0,12);
    const filterTopicOptions='<option value="all">All learning topics</option>'+topics.map(x=>`<option value="${esc(x)}"${logbookTopic===x?' selected':''}>${esc(x)}</option>`).join('');
    const rows=filteredEntries.length?visibleEntries.map(entry=>`<article class="lms-log-entry" data-log-id="${esc(entry.id)}"><div class="lms-log-entry-head"><div><span class="badge">${esc(entry.topic)}</span><h3>${esc(entry.title)}</h3></div><div class="lms-log-entry-actions"><button class="lms-log-edit" type="button" data-log-edit="${esc(entry.id)}" aria-label="Edit logbook entry ${esc(entry.title)}">Edit</button><button class="lms-log-delete" type="button" data-log-delete="${esc(entry.id)}" aria-label="Delete logbook entry ${esc(entry.title)}">Delete</button></div></div><p class="lms-log-meta">${esc(entry.activity)}${entry.system?' · '+esc(entry.system):''} · Created <time datetime="${esc(entry.createdAt)}">${esc(fmt(entry.createdAt))}</time>${entry.updatedAt?' · Updated <time datetime="'+esc(entry.updatedAt)+'">'+esc(fmt(entry.updatedAt))+'</time>':''}</p>${entry.evidence?`<div class="lms-log-block"><strong>Evidence / observations</strong><p>${esc(entry.evidence)}</p></div>`:''}${entry.learning?`<div class="lms-log-block"><strong>Learning / reflection</strong><p>${esc(entry.learning)}</p></div>`:''}${entry.nextAction?`<div class="lms-log-block"><strong>Next action</strong><p>${esc(entry.nextAction)}</p></div>`:''}</article>`).join(''):entries.length?'<div class="lms-empty">No entries match the current search and learning-topic filter.</div>':'<div class="lms-empty">No practical learning entries yet. Record a safe, non-confidential observation, measurement, troubleshooting exercise or reflection to build your personal learning history.</div>';
    const filterControls=entries.length?`<div class="lms-log-fields"><label>Search saved entries<input type="search" data-log-search value="${esc(logbookQuery)}" placeholder="Search title, system, observations or learning" aria-controls="lms-log-list"></label><label>Filter by learning topic<select data-log-topic-filter aria-controls="lms-log-list">${filterTopicOptions}</select></label></div><p class="lms-local-note" role="status">${filteredEntries.length} of ${entries.length} entries match</p>`:'';
    const viewControl=filteredEntries.length>12?`<div class="lms-log-actions"><button class="btn btn-secondary" type="button" data-log-view-toggle aria-expanded="${showAllEntries}">${showAllEntries?'Show recent 12':'Show all '+filteredEntries.length+' matching entries'}</button></div>`:'';

    host.innerHTML=`<div class="lms-log-summary"><div><small>Local logbook entries</small><strong>${entries.length}</strong></div><div><small>Storage mode</small><strong>Browser only</strong></div><div><small>Formal competency record</small><strong>No</strong></div></div>
    <div class="lms-logbook-grid"><form class="lms-log-form" data-log-form><p class="lms-local-note" data-log-edit-note hidden></p><div class="lms-log-fields"><label>Learning topic<select name="topic" required>${topicOptions}</select></label><label>Activity type<select name="activity" required>${activityOptions}</select></label><label class="lms-log-full">Entry title<input name="title" maxlength="90" required placeholder="Example: Investigated AHU low-airflow symptom"></label><label class="lms-log-full">Asset / system (optional)<input name="system" maxlength="80" placeholder="Use a generic description; avoid confidential asset identifiers"></label><label class="lms-log-full">Evidence / observations<textarea name="evidence" maxlength="1200" rows="4" placeholder="Record measurements, symptoms, checks or observations. Do not include passwords, personal data, confidential drawings or restricted company information."></textarea></label><label class="lms-log-full">What did you learn?<textarea name="learning" maxlength="1000" rows="3" placeholder="Summarize the engineering lesson, reasoning or principle you learned."></textarea></label><label class="lms-log-full">Next learning action (optional)<textarea name="nextAction" maxlength="600" rows="2" placeholder="Example: Review VFD guide and verify fan rotation/command logic next time."></textarea></label></div><div class="lms-log-actions"><button class="btn btn-primary" type="submit" data-log-submit>Save logbook entry</button><button class="btn btn-secondary" type="button" data-log-cancel-edit hidden>Cancel edit</button><button class="btn btn-secondary" type="button" data-log-export-json${entries.length?'':' disabled'}>Export JSON</button><button class="btn btn-secondary" type="button" data-log-export-csv${entries.length?'':' disabled'}>Export CSV</button><button class="btn btn-secondary" type="button" data-log-import>Import JSON</button><input type="file" accept="application/json,.json" data-log-import-file hidden></div><p class="lms-local-note"><strong>Privacy:</strong> this is a personal browser-local learning log. The dashboard’s complete learner backup includes these entries; standalone JSON import/export is available for logbook-only transfer. Do not record confidential employer information, personal data, passwords, restricted drawings, proprietary settings or safety-sensitive details. Logbook entries are educational reflections only and are not formal competency evidence or authorization to perform work.</p></form><div><h3 class="lms-log-recent-title">Recent entries</h3>${filterControls}<div class="lms-log-list" id="lms-log-list">${rows}</div>${viewControl}</div></div>`;
  };

  document.addEventListener('input',e=>{
    const search=e.target.closest('[data-log-search]');if(!search)return;
    logbookQuery=search.value;showAllEntries=true;render();focusSearch();
  });

  document.addEventListener('change',e=>{
    const topicFilter=e.target.closest('[data-log-topic-filter]');if(!topicFilter)return;
    logbookTopic=topicFilter.value;showAllEntries=true;render();
    announce(filterEntries(getEntries()).length+' logbook entries match the selected topic');
    focusElement(document.querySelector('[data-log-topic-filter]'));
  });

  document.addEventListener('change',async e=>{
    const input=e.target.closest('[data-log-import-file]');if(!input)return;
    const file=input.files&&input.files[0];input.value='';if(!file)return;
    if(file.size>2*1024*1024){announce('Logbook backup is too large to import.');return;}
    try{
      const imported=validateImport(JSON.parse(await file.text()));
      if(!confirm('Import '+imported.length+' logbook entries? Matching entry IDs will be updated; other current entries will be kept.')){announce('Logbook import cancelled');return;}
      const importedIds=new Set(imported.map(entry=>entry.id));
      const current=getEntries();const merged=[...imported,...current.filter(entry=>!importedIds.has(entry.id))];
      saveEntries(merged);render();announce(imported.length+' logbook entries imported safely; '+Math.max(0,merged.length-imported.length)+' other current entries were retained.');
      focusElement(document.querySelector('[data-log-import]'));
    }catch(error){announce(error&&error.message?error.message:'Logbook backup could not be imported.');}
  });

  document.addEventListener('invalid',e=>{
    const field=e.target.closest('[data-log-form] [required]');if(!field)return;
    const names={topic:'learning topic',activity:'activity type',title:'entry title'};
    announce('Please complete the required '+(names[field.name]||'logbook field'));
  },true);

  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-log-form]');if(!form)return;
    e.preventDefault();
    const fd=new FormData(form);
    const values={
      topic:String(fd.get('topic')||'').trim(),
      activity:String(fd.get('activity')||'').trim(),
      title:String(fd.get('title')||'').trim(),
      system:String(fd.get('system')||'').trim(),
      evidence:String(fd.get('evidence')||'').trim(),
      learning:String(fd.get('learning')||'').trim(),
      nextAction:String(fd.get('nextAction')||'').trim()
    };
    if(!values.title||!values.topic||!values.activity)return;
    const entries=getEntries();const editingId=form.dataset.editingId;
    if(editingId){
      const index=entries.findIndex(entry=>entry.id===editingId);
      if(index<0){render();announce('This logbook entry is no longer available to edit');return;}
      entries[index]={...entries[index],...values,updatedAt:new Date().toISOString()};
      saveEntries(entries);addActivity('Updated practical learning log: '+values.title);
      render();announce('Practical learning logbook entry updated on this browser');focusEdit(editingId);
    }else{
      const entry={id:(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)),...values,createdAt:new Date().toISOString()};
      entries.unshift(entry);saveEntries(entries);addActivity('Added practical learning log: '+entry.title);
      render();announce('Practical learning logbook entry saved on this browser');
      focusElement(document.querySelector('[data-log-form] [name="title"]'));
    }
  });

  document.addEventListener('click',e=>{
    const importButton=e.target.closest('[data-log-import]');
    if(importButton){const input=document.querySelector('[data-log-import-file]');if(input)input.click();return;}
    const cancelEdit=e.target.closest('[data-log-cancel-edit]');
    if(cancelEdit){render();announce('Logbook edit cancelled');focusElement(document.querySelector('[data-log-form] [name="title"]'));return;}
    const edit=e.target.closest('[data-log-edit]');
    if(edit){
      const entry=getEntries().find(item=>item.id===edit.dataset.logEdit);const form=document.querySelector('[data-log-form]');
      if(!entry||!form){announce('This logbook entry is no longer available to edit');return;}
      ['topic','activity','title','system','evidence','learning','nextAction'].forEach(name=>{const field=form.elements[name];if(field)field.value=entry[name]||''});
      form.dataset.editingId=entry.id;
      const submit=form.querySelector('[data-log-submit]');if(submit)submit.textContent='Save changes';
      const cancel=form.querySelector('[data-log-cancel-edit]');if(cancel)cancel.hidden=false;
      const note=form.querySelector('[data-log-edit-note]');if(note){note.hidden=false;note.textContent='Editing: '+entry.title+'. The original creation time will be preserved.';}
      announce('Editing logbook entry '+entry.title);focusElement(form.elements.title);return;
    }
    const viewToggle=e.target.closest('[data-log-view-toggle]');
    if(viewToggle){
      showAllEntries=!showAllEntries;render();
      announce(showAllEntries?'Showing all '+getEntries().length+' logbook entries':'Showing the 12 most recent logbook entries');
      focusElement(document.querySelector('[data-log-view-toggle]'));return;
    }
    const del=e.target.closest('[data-log-delete]');
    if(del){
      const id=del.dataset.logDelete;
      const entries=getEntries();const found=entries.find(x=>x.id===id);
      if(found&&confirm('Delete this browser-local logbook entry?')){
        const matchedEntries=filterEntries(entries);
        const index=matchedEntries.findIndex(x=>x.id===id);
        const remaining=entries.filter(x=>x.id!==id);
        const remainingMatches=filterEntries(remaining);
        const nextEntry=remainingMatches[Math.min(index,remainingMatches.length-1)];
        saveEntries(remaining);
        addActivity('Deleted practical learning log: '+found.title);
        render();announce('Logbook entry deleted');
        if(nextEntry)focusDelete(nextEntry.id);else focusElement(document.querySelector('[data-log-form] [name="title"]'));
      }
      return;
    }
    if(e.target.closest('[data-log-export-json]')){
      const entries=getEntries();if(!entries.length){announce('Add a logbook entry before exporting');return;}
      const payload={exportedAt:new Date().toISOString(),type:'SEA practical learning logbook',entries};
      download(JSON.stringify(payload,null,2),'application/json','SEA-practical-learning-logbook.json','Logbook exported as JSON');return;
    }
    if(e.target.closest('[data-log-export-csv]')){
      const entries=getEntries();if(!entries.length){announce('Add a logbook entry before exporting');return;}
      const header=['Created At','Updated At','Topic','Activity','Title','Asset/System','Evidence/Observations','Learning/Reflection','Next Action'];
      const lines=[header.map(csvCell).join(','),...entries.map(x=>[x.createdAt,x.updatedAt||'',x.topic,x.activity,x.title,x.system,x.evidence,x.learning,x.nextAction].map(csvCell).join(','))];
      download('\ufeff'+lines.join('\n'),'text/csv;charset=utf-8','SEA-practical-learning-logbook.csv','Logbook exported as CSV');
    }
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
