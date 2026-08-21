(()=>{
  const KEY='sea_lms_course_notes_v1';
  const MAX=4000;
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
  const write=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const announce=message=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
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
    card.innerHTML=`<h2>My study notes</h2><p class="lead">Save concise personal learning notes for this course on this browser. They are included in the complete SEA learner backup.</p><div class="field"><label for="lmsCourseNote">Course note</label><textarea id="lmsCourseNote" maxlength="${MAX}" placeholder="Record key concepts, questions to revisit, calculations to practise, or non-confidential learning takeaways."></textarea></div><div class="lms-toolbar" style="margin-top:12px"><button class="btn btn-primary" type="button" data-lms-note-save>Save note</button><button class="btn btn-secondary" type="button" data-lms-note-clear>Clear note</button></div><p class="lms-local-note" data-lms-note-status>Browser-local only. Do not enter employer-confidential information, passwords, restricted drawings, proprietary settings, personal data, or sensitive operational details.</p>`;
    if(quiz)quiz.insertAdjacentElement('afterend',card);else host.appendChild(card);
    const area=card.querySelector('textarea');
    const status=card.querySelector('[data-lms-note-status]');
    area.value=String(saved.text||'').slice(0,MAX);
    if(saved.updatedAt)status.textContent=`Last saved ${formatWhen(saved.updatedAt)}. Browser-local and included in complete learner backup.`;
    card.querySelector('[data-lms-note-save]').addEventListener('click',()=>{
      const text=area.value.trim().slice(0,MAX);
      const state=read();
      if(text){state[id]={text,updatedAt:new Date().toISOString()};write(state);status.textContent=`Saved ${formatWhen(state[id].updatedAt)}. Browser-local and included in complete learner backup.`;announce('Course study note saved.');}
      else{delete state[id];write(state);status.textContent='Empty note removed. Browser-local only.';announce('Empty course note removed.');}
    });
    card.querySelector('[data-lms-note-clear]').addEventListener('click',()=>{
      if(!area.value&&!read()[id])return;
      if(!confirm('Clear this browser-local course note?'))return;
      const state=read();delete state[id];write(state);area.value='';status.textContent='Course note cleared.';announce('Course study note cleared.');
    });
  };

  const mountDashboard=()=>{
    const main=document.querySelector('[data-lms-dashboard]');
    if(!main||document.querySelector('[data-lms-study-notes-summary]'))return;
    const learning=document.querySelector('#learning');
    const panel=document.createElement('section');
    panel.className='panel';panel.id='study-notes';panel.dataset.lmsStudyNotesSummary='';
    const state=read();
    const entries=Object.entries(state).filter(([,v])=>v&&String(v.text||'').trim()).sort((a,b)=>new Date(b[1].updatedAt||0)-new Date(a[1].updatedAt||0));
    const rows=entries.length?entries.map(([id,v])=>{const text=String(v.text||'').replace(/\s+/g,' ').trim();const snippet=text.length>150?text.slice(0,147)+'…':text;return `<div class="lms-item"><div class="lms-item-icon">NOTE</div><div><h3>${courseTitle(id)}</h3><p>${snippet.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</p><small>${v.updatedAt?'Last saved '+formatWhen(v.updatedAt):'Saved locally'}</small></div><a class="btn btn-secondary" href="${courseHref(id)}">Open course</a></div>`}).join(''):'<p class="lms-local-note">No course-specific study notes saved yet. Open a supported course and use “My study notes” to record key learning takeaways.</p>';
    panel.innerHTML=`<h2>Course study notes</h2><p class="lms-local-note">Personal browser-local notes are included in the complete learner backup. Keep notes educational and non-confidential.</p><div class="lms-list">${rows}</div>`;
    if(learning)learning.insertAdjacentElement('beforebegin',panel);else main.appendChild(panel);
    const nav=document.querySelector('.side-nav');
    if(nav&&!nav.querySelector('a[href="#study-notes"]')){
      const a=document.createElement('a');a.href='#study-notes';a.textContent='Study Notes';
      const learningLink=nav.querySelector('a[href="#learning"]');
      if(learningLink)learningLink.insertAdjacentElement('beforebegin',a);else nav.appendChild(a);
    }
  };

  const init=()=>{mountCourseNotes();mountDashboard()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
