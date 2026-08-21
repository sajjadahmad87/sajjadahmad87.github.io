(()=>{
  const KEY='sea_lms_course_notes_v1';
  const MAX=4000;
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
  const write=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const announce=message=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const courseTitle=id=>({
    'industrial-hvac-troubleshooting':'Industrial HVAC Troubleshooting Masterclass',
    'root-cause-analysis':'Root Cause Analysis for Maintenance Engineers',
    'plc-automation-fundamentals':'PLC & Automation Fundamentals for Maintenance',
    'electrical-troubleshooting':'Electrical Troubleshooting for Industrial Maintenance',
    'preventive-maintenance-ppm':'Preventive Maintenance Planning & PPM Excellence',
    'utilities-optimization':'Industrial Energy & Utilities Optimization',
    'solar-pv-battery':'Solar PV Fundamentals & Battery Systems',
    'boiler-steam-efficiency':'Boiler & Steam System Efficiency',
    'engineering-management':'Engineering Management: KPI, CAPEX, OPEX & Teams'
  }[id]||id.replace(/-/g,' '));
  const courseHref=id=>id==='industrial-hvac-troubleshooting'?'course.html':'courses.html#'+encodeURIComponent(id);
  const formatWhen=iso=>{const d=new Date(iso||'');return Number.isNaN(d.getTime())?'':d.toLocaleString([], {dateStyle:'medium',timeStyle:'short'})};

  const mountCourseNotes=()=>{
    const id=document.body.dataset.lmsCourse;
    if(!id||document.querySelector('[data-lms-course-notes]'))return;
    const quiz=document.querySelector('#knowledge-check');
    const host=quiz?.parentElement||document.querySelector('.course-intro');
    if(!host)return;
    const notes=read();
    const saved=notes[id]||{};
    const card=document.createElement('div');
    card.className='content-card';
    card.dataset.lmsCourseNotes='';
    card.innerHTML=`<h2>My study notes</h2><p class="lead">Save concise personal learning notes for this course on this browser. They are included in the complete SEA learner backup.</p><div class="field"><label for="lmsCourseNote">Course note</label><textarea id="lmsCourseNote" maxlength="${MAX}" aria-describedby="lmsCourseNoteCount lmsCourseNoteStatus" placeholder="Record key concepts, questions to revisit, calculations to practise, or non-confidential learning takeaways."></textarea><small id="lmsCourseNoteCount" data-lms-note-count aria-live="polite"></small></div><div class="lms-toolbar" style="margin-top:12px"><button class="btn btn-primary" type="button" data-lms-note-save>Save note</button><button class="btn btn-secondary" type="button" data-lms-note-clear>Clear note</button></div><p class="lms-local-note" id="lmsCourseNoteStatus" data-lms-note-status>Browser-local only. Do not enter employer-confidential information, passwords, restricted drawings, proprietary settings, personal data, or sensitive operational details.</p>`;
    if(quiz)quiz.insertAdjacentElement('afterend',card);else host.appendChild(card);
    const area=card.querySelector('textarea');
    const status=card.querySelector('[data-lms-note-status]');
    const count=card.querySelector('[data-lms-note-count]');
    const saveButton=card.querySelector('[data-lms-note-save]');
    let savedSnapshot=String(saved.text||'').slice(0,MAX);
    area.value=savedSnapshot;
    const isDirty=()=>area.value.trim()!==savedSnapshot.trim();
    const refresh=()=>{
      count.textContent=`${area.value.length.toLocaleString()} / ${MAX.toLocaleString()} characters`;
      const current=(read()[id]||{});
      if(isDirty())status.textContent='Unsaved changes. Save before leaving this page. Browser-local only; keep notes educational and non-confidential.';
      else if(current.updatedAt&&savedSnapshot)status.textContent=`Last saved ${formatWhen(current.updatedAt)}. Browser-local and included in complete learner backup.`;
      else status.textContent='Browser-local only. Do not enter employer-confidential information, passwords, restricted drawings, proprietary settings, personal data, or sensitive operational details.';
      saveButton.disabled=!isDirty();
    };
    const saveNote=()=>{
      const text=area.value.trim().slice(0,MAX),state=read();
      if(text){state[id]={text,updatedAt:new Date().toISOString()};write(state);savedSnapshot=text;area.value=text;announce('Course study note saved.');}
      else{delete state[id];write(state);savedSnapshot='';area.value='';announce('Empty course note removed.');}
      refresh();
    };
    area.addEventListener('input',refresh);
    area.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(isDirty())saveNote()}});
    window.addEventListener('beforeunload',e=>{if(!isDirty())return;e.preventDefault();e.returnValue=''});
    saveButton.addEventListener('click',saveNote);
    card.querySelector('[data-lms-note-clear]').addEventListener('click',()=>{if(!area.value&&!read()[id])return;if(!confirm('Clear this browser-local course note?'))return;const state=read();delete state[id];write(state);savedSnapshot='';area.value='';refresh();announce('Course study note cleared.');});
    refresh();
  };

  const mountCatalogNotes=()=>{
    const cards=[...document.querySelectorAll('.course-card[data-title]')];
    if(!cards.length||document.querySelector('[data-lms-notes-dialog]'))return;
    const dialog=document.createElement('dialog');
    dialog.dataset.lmsNotesDialog='';
    dialog.setAttribute('aria-labelledby','lmsCatalogNoteTitle');
    dialog.style.cssText='width:min(680px,calc(100% - 28px));border:1px solid rgba(145,225,255,.2);border-radius:16px;padding:0;background:#0b1b28;color:#f3f8fb;box-shadow:0 24px 70px rgba(0,0,0,.45)';
    dialog.innerHTML=`<div style="padding:22px"><div style="display:flex;justify-content:space-between;gap:16px;align-items:start"><div><span class="label">PERSONAL STUDY NOTE</span><h2 id="lmsCatalogNoteTitle" style="margin:7px 0 4px;font-size:20px"></h2></div><button class="btn btn-secondary" type="button" data-lms-note-close aria-label="Close study note">Close</button></div><p class="lms-local-note">Save a personal note for this learning path. Notes stay in this browser and are included in the complete SEA learner backup.</p><div class="field"><label for="lmsCatalogNoteArea">Study note</label><textarea id="lmsCatalogNoteArea" maxlength="${MAX}" aria-describedby="lmsCatalogNoteCount lmsCatalogNoteStatus" placeholder="Record key concepts, questions to revisit, calculations to practise, or non-confidential learning takeaways."></textarea><small id="lmsCatalogNoteCount" data-lms-catalog-note-count aria-live="polite"></small></div><div class="lms-toolbar" style="margin-top:12px"><button class="btn btn-primary" type="button" data-lms-catalog-note-save>Save note</button><button class="btn btn-secondary" type="button" data-lms-catalog-note-clear>Clear note</button></div><p class="lms-local-note" id="lmsCatalogNoteStatus" data-lms-catalog-note-status></p></div>`;
    document.body.appendChild(dialog);
    const title=dialog.querySelector('#lmsCatalogNoteTitle'),area=dialog.querySelector('textarea'),count=dialog.querySelector('[data-lms-catalog-note-count]'),status=dialog.querySelector('[data-lms-catalog-note-status]'),save=dialog.querySelector('[data-lms-catalog-note-save]');
    let currentId='',savedSnapshot='';
    const dirty=()=>area.value.trim()!==savedSnapshot.trim();
    const refresh=()=>{
      count.textContent=`${area.value.length.toLocaleString()} / ${MAX.toLocaleString()} characters`;
      const current=(read()[currentId]||{});
      if(dirty())status.textContent='Unsaved changes. Save before closing this note.';
      else if(current.updatedAt&&savedSnapshot)status.textContent=`Last saved ${formatWhen(current.updatedAt)}. Browser-local and included in complete learner backup.`;
      else status.textContent='Browser-local only. Keep notes educational and non-confidential.';
      save.disabled=!dirty();
    };
    const openFor=id=>{
      if(dirty()&&!confirm('Discard unsaved changes and open another course note?'))return;
      currentId=id;const saved=read()[id]||{};savedSnapshot=String(saved.text||'').slice(0,MAX);area.value=savedSnapshot;title.textContent=courseTitle(id);refresh();
      if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
      setTimeout(()=>area.focus(),0);
    };
    const close=()=>{if(dirty()&&!confirm('Close without saving your changes?'))return;if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')};
    const saveNote=()=>{if(!currentId)return;const state=read(),text=area.value.trim().slice(0,MAX);if(text){state[currentId]={text,updatedAt:new Date().toISOString()};write(state);savedSnapshot=text;area.value=text;announce('Course study note saved.');}else{delete state[currentId];write(state);savedSnapshot='';area.value='';announce('Empty course note removed.');}refresh();};
    area.addEventListener('input',refresh);
    area.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(dirty())saveNote()}});
    dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
    dialog.querySelector('[data-lms-note-close]').addEventListener('click',close);
    save.addEventListener('click',saveNote);
    dialog.querySelector('[data-lms-catalog-note-clear]').addEventListener('click',()=>{if(!currentId||(!area.value&&!read()[currentId]))return;if(!confirm('Clear this browser-local course note?'))return;const state=read();delete state[currentId];write(state);savedSnapshot='';area.value='';refresh();announce('Course study note cleared.');});
    window.addEventListener('beforeunload',e=>{if(!dialog.hasAttribute('open')||!dirty())return;e.preventDefault();e.returnValue=''});
    cards.forEach(card=>{
      if(!card.id||card.querySelector('[data-lms-catalog-note]'))return;
      const button=document.createElement('button');button.type='button';button.className='btn btn-secondary';button.dataset.lmsCatalogNote='';button.textContent=read()[card.id]?.text?'Study note ✓':'Study note';button.setAttribute('aria-label','Open study note for '+courseTitle(card.id));button.addEventListener('click',()=>openFor(card.id));
      const row=card.querySelector('.lms-action-row'),body=card.querySelector('.course-body');if(row)row.appendChild(button);else if(body)body.appendChild(button);
    });
  };

  const mountDashboard=()=>{
    const main=document.querySelector('[data-lms-dashboard]');
    if(!main||document.querySelector('[data-lms-study-notes-summary]'))return;
    const learning=document.querySelector('#learning');
    const panel=document.createElement('section');panel.className='panel';panel.id='study-notes';panel.dataset.lmsStudyNotesSummary='';
    const entries=Object.entries(read()).filter(([,v])=>v&&String(v.text||'').trim()).sort((a,b)=>new Date(b[1].updatedAt||0)-new Date(a[1].updatedAt||0));
    const rows=entries.length?entries.map(([id,v])=>{const text=String(v.text||'').replace(/\s+/g,' ').trim(),snippet=text.length>150?text.slice(0,147)+'…':text;return `<div class="lms-item"><div class="lms-item-icon">NOTE</div><div><h3>${esc(courseTitle(id))}</h3><p>${esc(snippet)}</p><small>${v.updatedAt?'Last saved '+formatWhen(v.updatedAt):'Saved locally'}</small></div><a class="btn btn-secondary" href="${courseHref(id)}">Open course</a></div>`}).join(''):'<p class="lms-local-note">No course-specific study notes saved yet. Open the course catalog or a supported course and use “Study note” to record key learning takeaways.</p>';
    panel.innerHTML=`<h2>Course study notes</h2><p class="lms-local-note">Personal browser-local notes are included in the complete learner backup. Keep notes educational and non-confidential.</p><div class="lms-list">${rows}</div>`;
    if(learning)learning.insertAdjacentElement('beforebegin',panel);else main.appendChild(panel);
    const nav=document.querySelector('.side-nav');if(nav&&!nav.querySelector('a[href="#study-notes"]')){const a=document.createElement('a');a.href='#study-notes';a.textContent='Study Notes';const learningLink=nav.querySelector('a[href="#learning"]');if(learningLink)learningLink.insertAdjacentElement('beforebegin',a);else nav.appendChild(a)};
  };

  const init=()=>{mountCourseNotes();mountCatalogNotes();mountDashboard()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
