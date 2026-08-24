(()=>{
  const ACCOUNT_KEY='sea_account_v2';
  const SESSION_KEY='sea_session_v2';
  const LMS_KEY='sea_lms_state_v1';
  const MAX_ACTIVITY=40;
  const COURSES={
    'industrial-hvac-troubleshooting':{title:'Industrial HVAC Troubleshooting Masterclass',short:'HVAC',level:'Intermediate',href:'/course.html',modules:4},
    'root-cause-analysis':{title:'Root Cause Analysis for Maintenance Engineers',short:'RCA',level:'Intermediate',href:'/guides/root-cause-analysis-5-why/',modules:0},
    'plc-automation-fundamentals':{title:'PLC & Automation Fundamentals for Maintenance',short:'PLC',level:'Beginner',href:'/guides/vfd-fundamentals/',modules:0},
    'electrical-troubleshooting':{title:'Electrical Troubleshooting for Industrial Maintenance',short:'ELEC',level:'Intermediate',href:'/tools/three-phase-power-calculator/',modules:0},
    'preventive-maintenance-ppm':{title:'Preventive Maintenance Planning & PPM Excellence',short:'PPM',level:'Beginner',href:'/guides/ppm-checklist/',modules:0},
    'utilities-optimization':{title:'Industrial Energy & Utilities Optimization',short:'ENERGY',level:'Advanced',href:'/tools/energy-cost-payback-calculator/',modules:0},
    'solar-pv-battery':{title:'Solar PV Fundamentals & Battery Systems',short:'SOLAR',level:'Beginner',href:'/tools/energy-cost-payback-calculator/',modules:0},
    'boiler-steam-efficiency':{title:'Boiler & Steam System Efficiency',short:'STEAM',level:'Intermediate',href:'/guides/steam-trap/',modules:0},
    'engineering-management':{title:'Engineering Management: KPI, CAPEX, OPEX & Teams',short:'KPI',level:'Advanced',href:'/tools/mtbf-mttr-availability-calculator/',modules:0}
  };
  const HVAC_MODULES=[
    {id:'fundamentals',title:'HVAC Fundamentals',note:'Core system relationships, loads and measurements.',href:'/course.html#module-fundamentals'},
    {id:'airside',title:'AHU & Airside Diagnostics',note:'Airflow restrictions, fan/VFD checks and temperature evidence.',href:'/guides/ahu-troubleshooting/'},
    {id:'waterside',title:'Water-side Troubleshooting',note:'Flow, valve, temperature and system-performance reasoning.',href:'/course.html#module-waterside'},
    {id:'controls-rca',title:'Controls, Sensors & RCA',note:'Validate controls evidence and convert findings into corrective actions.',href:'/guides/root-cause-analysis-5-why/'}
  ];
  const COURSE_MODULE_IDS={
    'industrial-hvac-troubleshooting':HVAC_MODULES.map(module=>module.id)
  };

  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const account=()=>read(ACCOUNT_KEY);
  const session=()=>read(SESSION_KEY);
  const signedIn=()=>{const a=account(),s=session();return !!(a&&s&&a.email&&a.email===s.email)};
  const freshState=()=>({enrolled:{},saved:[],progress:{},activity:[],updatedAt:new Date().toISOString()});
  const getState=()=>{
    const raw=read(LMS_KEY)||freshState();
    raw.enrolled=raw.enrolled&&typeof raw.enrolled==='object'?raw.enrolled:{};
    raw.saved=Array.isArray(raw.saved)?raw.saved:[];
    raw.progress=raw.progress&&typeof raw.progress==='object'?raw.progress:{};
    raw.activity=Array.isArray(raw.activity)?raw.activity:[];
    return raw;
  };
  const saveState=(state)=>{state.updatedAt=new Date().toISOString();write(LMS_KEY,state)};
  const announce=(message)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const loginForCurrent=()=>{
    const target=location.pathname+location.search+location.hash;
    location.href='/signin.html?return='+encodeURIComponent(target);
  };
  const addActivity=(state,type,courseId,label)=>{
    state.activity.unshift({type,courseId,label:label||'',at:new Date().toISOString()});
    state.activity=state.activity.slice(0,MAX_ACTIVITY);
  };
  const ensureProgress=(state,courseId)=>{
    if(!state.progress[courseId]||typeof state.progress[courseId]!=='object') state.progress[courseId]={modules:{}};
    if(!state.progress[courseId].modules) state.progress[courseId].modules={};
    return state.progress[courseId];
  };
  const completedModuleCount=(state,courseId)=>{
    const moduleIds=COURSE_MODULE_IDS[courseId]||[];
    if(!moduleIds.length) return 0;
    const modules=ensureProgress(state,courseId).modules;
    return moduleIds.filter(moduleId=>modules[moduleId]===true).length;
  };
  const progressPercent=(state,courseId)=>{
    const meta=COURSES[courseId];
    if(!meta?.modules) return 0;
    return Math.min(100,Math.max(0,Math.round(completedModuleCount(state,courseId)/meta.modules*100)));
  };
  const enroll=(courseId)=>{
    if(!signedIn()){loginForCurrent();return false}
    const meta=COURSES[courseId];if(!meta)return false;
    const state=getState();
    if(!state.enrolled[courseId]){
      state.enrolled[courseId]={enrolledAt:new Date().toISOString(),lastOpenedAt:new Date().toISOString()};
      addActivity(state,'enrolled',courseId,'Enrolled in '+meta.title);
    }else state.enrolled[courseId].lastOpenedAt=new Date().toISOString();
    saveState(state);announce('Enrolled in '+meta.title);return true;
  };
  const toggleSaved=(courseId)=>{
    if(!signedIn()){loginForCurrent();return null}
    const meta=COURSES[courseId];if(!meta)return null;
    const state=getState();const i=state.saved.indexOf(courseId);let saved;
    if(i>=0){state.saved.splice(i,1);saved=false;addActivity(state,'unsaved',courseId,'Removed '+meta.title+' from saved learning')}
    else{state.saved.unshift(courseId);saved=true;addActivity(state,'saved',courseId,'Saved '+meta.title)}
    saveState(state);announce(saved?'Course saved':'Course removed from saved learning');return saved;
  };
  const touchCourse=(courseId)=>{
    if(!COURSES[courseId]||!signedIn())return;
    const state=getState();
    if(state.enrolled[courseId]) state.enrolled[courseId].lastOpenedAt=new Date().toISOString();
    addActivity(state,'opened',courseId,'Opened '+COURSES[courseId].title);saveState(state);
  };
  const setModule=(courseId,moduleId,done)=>{
    const module=HVAC_MODULES.find(item=>item.id===moduleId);
    if(!(COURSE_MODULE_IDS[courseId]||[]).includes(moduleId)||!module)return;
    if(!signedIn()){loginForCurrent();return}
    const state=getState();if(!state.enrolled[courseId]) state.enrolled[courseId]={enrolledAt:new Date().toISOString()};
    const p=ensureProgress(state,courseId);p.modules[moduleId]=!!done;p.updatedAt=new Date().toISOString();
    state.enrolled[courseId].lastOpenedAt=new Date().toISOString();
    addActivity(state,done?'module-complete':'module-reopened',courseId,(done?'Completed ':'Reopened ')+module.title);
    saveState(state);renderCourseProgress();announce((done?'Completed ':'Reopened ')+module.title);
  };
  const formatDate=(iso)=>{if(!iso)return '—';try{return new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch{return iso}};
  const esc=(s)=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const progressBar=(meta,pct)=>meta.modules?`<div class="lms-progress-bar" style="margin-top:8px" role="progressbar" aria-label="${esc(meta.title)} module progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>`:'';
  const dashboardCourseStatus=(meta,pct)=>{
    const complete=!!meta.modules&&pct>=100;
    return {
      complete,
      heading:complete?'Course milestones complete':'Continue learning',
      summary:meta.modules?(complete?`All ${meta.modules} module milestones reviewed`:`${pct}% module progress`):'Learning path',
      resumeLabel:complete?'Choose next path':'Resume',
      resumeHref:complete?'/courses.html':meta.href,
      listLabel:complete?'Review':'Continue'
    };
  };

  const enhanceCatalog=()=>{
    const state=getState();
    document.querySelectorAll('.course-card[id]').forEach(card=>{
      const id=card.id,meta=COURSES[id];if(!meta||card.querySelector('.lms-action-row'))return;
      const body=card.querySelector('.course-body');if(!body)return;
      const row=document.createElement('div');row.className='lms-action-row';
      const enrol=document.createElement('button');enrol.type='button';enrol.className='btn btn-secondary';enrol.dataset.lmsEnroll=id;
      enrol.textContent=state.enrolled[id]?'Enrolled ✓':'Enrol free';
      const save=document.createElement('button');save.type='button';save.className='btn lms-save';save.dataset.lmsSave=id;save.setAttribute('aria-pressed',String(state.saved.includes(id)));save.textContent=state.saved.includes(id)?'Saved ★':'Save ☆';
      row.append(enrol,save);body.appendChild(row);
    });
  };
  const wireActions=()=>{
    document.addEventListener('click',e=>{
      const enrol=e.target.closest('[data-lms-enroll]');
      if(enrol){
        const id=enrol.dataset.lmsEnroll;if(enroll(id)){enrol.textContent='Enrolled ✓';renderDashboard();renderCourseProgress()}
        return;
      }
      const save=e.target.closest('[data-lms-save]');
      if(save){
        const id=save.dataset.lmsSave;const result=toggleSaved(id);if(result!==null){save.setAttribute('aria-pressed',String(result));save.textContent=result?'Saved ★':'Save ☆';renderDashboard()}
        return;
      }
      const exportBtn=e.target.closest('[data-lms-export]');
      if(exportBtn){
        const payload={exportedAt:new Date().toISOString(),account:account(),learning:getState()};
        const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SEA-learning-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);announce('Learning progress exported');
        return;
      }
      const reset=e.target.closest('[data-lms-reset]');
      if(reset&&confirm('Reset saved courses, enrolments, module progress and local learning history on this browser? Your learner account will remain.')){localStorage.removeItem(LMS_KEY);announce('Local learning progress reset');renderDashboard();renderCourseProgress();document.querySelectorAll('[data-lms-save]').forEach(b=>{b.setAttribute('aria-pressed','false');b.textContent='Save ☆'});document.querySelectorAll('[data-lms-enroll]').forEach(b=>b.textContent='Enrol free')}
    });
  };
  const renderCourseProgress=()=>{
    const courseId=document.body.dataset.lmsCourse;
    if(!courseId||!COURSES[courseId])return;
    const state=getState();const pct=progressPercent(state,courseId);const enrolled=!!state.enrolled[courseId];const saved=state.saved.includes(courseId);
    document.querySelectorAll('[data-lms-progress-value]').forEach(el=>el.textContent=pct+'%');
    document.querySelectorAll('[data-lms-progress-bar]').forEach(el=>el.style.width=pct+'%');
    document.querySelectorAll('[data-lms-enroll="'+courseId+'"]').forEach(b=>b.textContent=enrolled?'Enrolled ✓':'Enrol free');
    document.querySelectorAll('[data-lms-save="'+courseId+'"]').forEach(b=>{b.setAttribute('aria-pressed',String(saved));b.textContent=saved?'Saved ★':'Save ☆'});
    document.querySelectorAll('[data-lms-module]').forEach(input=>{input.checked=!!ensureProgress(state,courseId).modules[input.dataset.lmsModule]});
    const status=document.querySelector('[data-lms-course-status]');if(status)status.textContent=enrolled?(pct===100?'Completed locally':'Enrolled on this browser'):'Not enrolled yet';
  };
  const wireModules=()=>document.querySelectorAll('[data-lms-module]').forEach(input=>input.addEventListener('change',()=>setModule(document.body.dataset.lmsCourse,input.dataset.lmsModule,input.checked)));

  const renderDashboard=()=>{
    const root=document.querySelector('[data-lms-dashboard]');if(!root)return;
    const a=account();const state=getState();
    const enrolledIds=Object.keys(state.enrolled).filter(id=>COURSES[id]);
    const savedIds=state.saved.filter(id=>COURSES[id]);
    const totalCompleted=Object.keys(COURSES).reduce((n,id)=>n+completedModuleCount(state,id),0);
    const initials=(a?.name||a?.email||'Learner').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
    document.querySelectorAll('[data-lms-name]').forEach(el=>el.textContent=a?.name||'Learner');
    document.querySelectorAll('[data-lms-avatar]').forEach(el=>el.textContent=initials||'LR');
    document.querySelectorAll('[data-lms-enrolled-count]').forEach(el=>el.textContent=String(enrolledIds.length));
    document.querySelectorAll('[data-lms-completed-count]').forEach(el=>el.textContent=String(totalCompleted));
    document.querySelectorAll('[data-lms-saved-count]').forEach(el=>el.textContent=String(savedIds.length));
    document.querySelectorAll('[data-lms-activity-count]').forEach(el=>el.textContent=String(state.activity.length));

    const learning=document.querySelector('[data-lms-learning-list]');
    const sortedEnrolled=enrolledIds.sort((x,y)=>String(state.enrolled[y].lastOpenedAt||state.enrolled[y].enrolledAt).localeCompare(String(state.enrolled[x].lastOpenedAt||state.enrolled[x].enrolledAt)));
    let resume=document.querySelector('[data-lms-resume]');
    if(!resume&&learning){
      const firstAnalytics=document.querySelector('#assessment-analytics');
      const learningPanel=learning.closest('.panel');
      resume=document.createElement('section');resume.className='panel';resume.setAttribute('data-lms-resume','');
      if(firstAnalytics)firstAnalytics.insertAdjacentElement('beforebegin',resume);
      else if(learningPanel)learningPanel.insertAdjacentElement('beforebegin',resume);
    }
    if(resume){
      if(sortedEnrolled.length){
        const resumableId=sortedEnrolled.find(id=>!COURSES[id].modules||progressPercent(state,id)<100);
        const id=resumableId||sortedEnrolled[0],m=COURSES[id],pct=progressPercent(state,id),last=state.enrolled[id].lastOpenedAt||state.enrolled[id].enrolledAt,status=dashboardCourseStatus(m,pct);
        resume.innerHTML=`<h2>${esc(status.heading)}</h2><div class="lms-item"><div class="lms-item-icon">${esc(m.short)}</div><div><h3>${esc(m.title)}</h3><p>${esc(status.summary)} · Last active ${esc(formatDate(last))}</p>${progressBar(m,pct)}</div><a class="btn btn-primary" href="${esc(status.resumeHref)}">${esc(status.resumeLabel)}</a></div>`;
      }else resume.innerHTML='<h2>Continue learning</h2><div class="lms-empty">Enrol in a learning path and your most recently opened course will appear here for one-click access.</div>';
    }
    if(learning){
      learning.innerHTML=sortedEnrolled.length?sortedEnrolled.map(id=>{
        const m=COURSES[id],pct=progressPercent(state,id),status=dashboardCourseStatus(m,pct);return `<div class="lms-item"><div class="lms-item-icon">${esc(m.short)}</div><div><h3>${esc(m.title)}</h3><p>${m.modules?esc(status.summary):'Learning path enrolled · Module tracking not yet available'} · ${esc(m.level)}</p>${progressBar(m,pct)}</div><a class="btn btn-secondary" href="${esc(m.href)}">${esc(status.listLabel)}</a></div>`
      }).join(''):`<div class="lms-empty">You have not enrolled in a learning path on this browser yet. <a href="/courses.html" style="color:var(--cyan)">Explore free courses →</a></div>`;
    }
    const saved=document.querySelector('[data-lms-saved-list]');
    if(saved){
      saved.innerHTML=savedIds.length?savedIds.map(id=>{const m=COURSES[id];return `<div class="lms-item"><div class="lms-item-icon">${esc(m.short)}</div><div><h3>${esc(m.title)}</h3><p>${esc(m.level)} · Saved for later</p></div><a class="btn btn-secondary" href="${esc(m.href)}">Open</a></div>`}).join(''):`<div class="lms-empty">No saved learning paths yet. Use the <strong>Save</strong> button in the course library to build your learning list.</div>`;
    }
    const activity=document.querySelector('[data-lms-activity-list]');
    if(activity){activity.innerHTML=state.activity.length?state.activity.slice(0,12).map(x=>`<div class="lms-activity-item"><strong>${esc(x.label||x.type)}</strong><time datetime="${esc(x.at)}">${esc(formatDate(x.at))}</time></div>`).join(''):`<div class="lms-empty">Your local learning activity will appear here as you enrol, save courses and complete modules.</div>`}
    const profile=document.querySelector('[data-lms-profile]');
    if(profile){profile.innerHTML=`<div class="lms-profile-grid"><div class="lms-profile-field"><small>Name</small><strong>${esc(a?.name||'Not set')}</strong></div><div class="lms-profile-field"><small>Email</small><strong>${esc(a?.email||'Not set')}</strong></div><div class="lms-profile-field"><small>Discipline</small><strong>${esc(a?.discipline||'Not set')}</strong></div><div class="lms-profile-field"><small>Country</small><strong>${esc(a?.country||'Not set')}</strong></div></div>`}
  };

  document.addEventListener('DOMContentLoaded',()=>{
    enhanceCatalog();wireActions();wireModules();renderCourseProgress();renderDashboard();
    const courseId=document.body.dataset.lmsCourse;if(courseId)touchCourse(courseId);
  });

  window.SEALMS={getState,enroll,toggleSaved,completedModuleCount,progressPercent,dashboardCourseStatus};
})();
