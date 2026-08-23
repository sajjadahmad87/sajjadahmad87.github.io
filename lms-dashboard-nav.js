(()=>{
  const root=document.querySelector('[data-lms-dashboard]');
  const nav=document.querySelector('.side-nav');
  if(!root||!nav)return;

  const sidebar=nav.closest('.sidebar');
  const navToggle=sidebar?.querySelector('[data-lms-side-nav-toggle]');
  const navCurrent=sidebar?.querySelector('[data-lms-side-nav-current]');
  const mobileNav=window.matchMedia?.('(max-width: 760px)');

  const closeMobileNav=({restoreFocus=false}={})=>{
    if(!sidebar||!navToggle)return;
    sidebar.classList.remove('side-nav-open');
    navToggle.setAttribute('aria-expanded','false');
    if(restoreFocus)navToggle.focus();
  };

  if(sidebar&&navToggle&&mobileNav){
    sidebar.classList.add('lms-nav-enhanced');
    navToggle.addEventListener('click',()=>{
      const open=!sidebar.classList.contains('side-nav-open');
      sidebar.classList.toggle('side-nav-open',open);
      navToggle.setAttribute('aria-expanded',String(open));
      if(open)nav.querySelector('a.active, a')?.focus();
    });
    sidebar.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&sidebar.classList.contains('side-nav-open')){
        event.preventDefault();
        closeMobileNav({restoreFocus:true});
      }
    });
    const syncMobileNav=()=>{if(!mobileNav.matches)closeMobileNav()};
    mobileNav.addEventListener?.('change',syncMobileNav);
    mobileNav.addListener?.(syncMobileNav);
  }

  const links=()=>[...nav.querySelectorAll('a[href^="#"]')];
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let observer=null;
  let activeId='';

  const setActive=(id,{updateHash=true}={})=>{
    if(!id)return;
    activeId=id;
    let activeLink=null;
    links().forEach(link=>{
      const active=link.getAttribute('href')==='#'+id;
      link.classList.toggle('active',active);
      if(active){
        link.setAttribute('aria-current','location');
        activeLink=link;
      }else link.removeAttribute('aria-current');
    });
    if(activeLink){
      if(navCurrent)navCurrent.textContent=activeLink.textContent.trim();
      activeLink.scrollIntoView({block:'nearest',inline:'nearest',behavior:reduceMotion?'auto':'smooth'});
    }
    if(updateHash&&history.replaceState&&location.hash!=='#'+id){
      history.replaceState(null,'','#'+encodeURIComponent(id));
    }
  };

  const observeSections=()=>{
    if(!('IntersectionObserver' in window))return;
    if(observer)observer.disconnect();
    const visible=new Map();
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting)visible.set(entry.target.id,entry.boundingClientRect.top);
        else visible.delete(entry.target.id);
      });
      if(!visible.size)return;
      const current=[...visible.entries()].sort((a,b)=>Math.abs(a[1])-Math.abs(b[1]))[0]?.[0];
      if(current&&current!==activeId)setActive(current);
    },{rootMargin:'-18% 0px -68% 0px',threshold:[0,0.01]});

    links().forEach(link=>{
      const id=decodeURIComponent((link.getAttribute('href')||'').slice(1));
      const section=id&&document.getElementById(id);
      if(section)observer.observe(section);
    });
  };

  nav.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link)return;
    const id=decodeURIComponent((link.getAttribute('href')||'').slice(1));
    if(id)setActive(id,{updateHash:false});
    if(mobileNav?.matches)closeMobileNav();
  });

  window.addEventListener('hashchange',()=>{
    const id=decodeURIComponent((location.hash||'#overview').slice(1));
    if(document.getElementById(id))setActive(id,{updateHash:false});
  });

  const initial=decodeURIComponent((location.hash||'#overview').slice(1));
  if(document.getElementById(initial))setActive(initial,{updateHash:false});
  observeSections();

  const mutationObserver=new MutationObserver(()=>{
    clearTimeout(mutationObserver._timer);
    mutationObserver._timer=setTimeout(observeSections,60);
  });
  mutationObserver.observe(nav,{childList:true,subtree:true});

  const enhanceResumeTarget=()=>{
    const resume=root.querySelector('[data-lms-resume]');
    const resumeLink=resume?.querySelector('a.btn-primary');
    if(!resumeLink)return;

    let state=null;
    try{state=JSON.parse(localStorage.getItem('sea_lms_state_v1')||'null')}catch{return}
    const progress=state?.progress?.['industrial-hvac-troubleshooting']?.modules;
    if(!progress||!resumeLink.getAttribute('href')?.endsWith('/course.html'))return;

    const modules=[
      {id:'fundamentals',title:'HVAC Fundamentals',href:'/course.html#module-fundamentals'},
      {id:'airside',title:'AHU & Airside Diagnostics',href:'/guides/ahu-troubleshooting/'},
      {id:'waterside',title:'Water-side Troubleshooting',href:'/course.html#module-waterside'},
      {id:'controls-rca',title:'Controls, Sensors & RCA',href:'/guides/root-cause-analysis-5-why/'}
    ];
    const next=modules.find(module=>!progress[module.id]);
    if(!next)return;

    resumeLink.href=next.href;
    resumeLink.textContent='Resume next module';
    resumeLink.setAttribute('aria-label','Resume next module: '+next.title);
    const summary=resume.querySelector('.lms-item p');
    if(summary&&!summary.querySelector?.('[data-lms-next-module]')){
      summary.insertAdjacentHTML('beforeend',' · <strong data-lms-next-module></strong>');
      const nextLabel=summary.querySelector('[data-lms-next-module]');
      if(nextLabel)nextLabel.textContent='Next: '+next.title;
    }
  };

  const readLocal=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const renderNextBestAction=()=>{
    let panel=root.querySelector('[data-lms-next-best-action]');
    if(!panel){
      panel=document.createElement('section');
      panel.className='panel';
      panel.id='next-best-action';
      panel.dataset.lmsNextBestAction='';
      panel.setAttribute('aria-labelledby','next-best-action-title');
      const status=root.querySelector('.lms-status');
      if(status)status.insertAdjacentElement('afterend',panel);
      else root.prepend(panel);
    }

    const state=readLocal('sea_lms_state_v1')||{};
    const enrolled=state.enrolled&&typeof state.enrolled==='object'?state.enrolled:{};
    const saved=Array.isArray(state.saved)?state.saved:[];
    const hvacModules=state.progress?.['industrial-hvac-troubleshooting']?.modules||{};
    const hvacSequence=[
      {id:'fundamentals',title:'HVAC Fundamentals',href:'/course.html#module-fundamentals'},
      {id:'airside',title:'AHU & Airside Diagnostics',href:'/guides/ahu-troubleshooting/'},
      {id:'waterside',title:'Water-side Troubleshooting',href:'/course.html#module-waterside'},
      {id:'controls-rca',title:'Controls, Sensors & RCA',href:'/guides/root-cause-analysis-5-why/'}
    ];
    const quizzes=[
      {key:'sea_lms_quiz_v1',title:'HVAC troubleshooting knowledge check',href:'/course.html#knowledge-check'},
      {key:'sea_lms_quiz_rca_v1',title:'RCA & 5-Why knowledge check',href:'/quiz-rca.html'},
      {key:'sea_lms_quiz_ppm_v1',title:'Preventive maintenance & PPM knowledge check',href:'/quiz-ppm.html'},
      {key:'sea_lms_quiz_electrical_v1',title:'Electrical troubleshooting knowledge check',href:'/quiz-electrical.html'}
    ];

    let action=null;
    if(enrolled['industrial-hvac-troubleshooting']){
      const nextModule=hvacSequence.find(module=>!hvacModules[module.id]);
      if(nextModule)action={eyebrow:'CONTINUE YOUR PATH',title:nextModule.title,detail:'Continue the first unfinished module in your enrolled HVAC learning path.',href:nextModule.href,label:'Continue module'};
    }

    if(!action){
      const notes=readLocal('sea_lms_course_notes_v1');
      const reviewCount=notes&&typeof notes==='object'?Object.values(notes).filter(note=>note&&note.needsReview).length:0;
      if(reviewCount>0)action={eyebrow:'REVISION QUEUE',title:`Review ${reviewCount} saved study note${reviewCount===1?'':'s'}`,detail:'Clear items you previously marked for review before adding more study material.',href:'#study-notes',label:'Open revision queue'};
    }

    if(!action){
      const unattempted=quizzes.find(quiz=>{
        const data=readLocal(quiz.key);
        return !Array.isArray(data?.attempts)||data.attempts.length===0;
      });
      if(unattempted)action={eyebrow:'KNOWLEDGE CHECK',title:unattempted.title,detail:'Use a short self-assessment to identify which topic would benefit most from review.',href:unattempted.href,label:'Take knowledge check'};
    }

    if(!action){
      const retry=quizzes.map(quiz=>{
        const attempts=readLocal(quiz.key)?.attempts;
        if(!Array.isArray(attempts)||!attempts.length)return null;
        const best=Math.max(...attempts.map(item=>Number(item?.total)>0?(Number(item.score)||0)/Number(item.total):0));
        return {...quiz,best};
      }).filter(Boolean).sort((a,b)=>a.best-b.best)[0];
      if(retry&&retry.best<0.8)action={eyebrow:'TARGETED REVIEW',title:`Revisit ${retry.title}`,detail:`Your best saved result is ${Math.round(retry.best*100)}%. Review the explanations and retry when ready.`,href:retry.href,label:'Review and retry'};
    }

    if(!action&&Object.keys(enrolled).length===0){
      action=saved.length?{eyebrow:'START LEARNING',title:'Open a saved learning path',detail:'Turn one of your saved topics into an active learning path.',href:'#saved',label:'View saved learning'}:{eyebrow:'START LEARNING',title:'Choose your first engineering learning path',detail:'Browse the free course library and enrol in a topic that matches your current development need.',href:'/courses.html',label:'Explore free courses'};
    }

    if(!action)action={eyebrow:'KEEP MOMENTUM',title:'Continue your most recent learning path',detail:'Your core learning checks are up to date. Continue with your enrolled material or practical reflection.',href:'#learning',label:'Open my courses'};

    panel.innerHTML=`<div class="label">${esc(action.eyebrow)}</div><h2 id="next-best-action-title" style="margin:8px 0 6px">Next best learning action</h2><div class="lms-item"><div class="lms-item-icon">NEXT</div><div><h3>${esc(action.title)}</h3><p>${esc(action.detail)}</p></div><a class="btn btn-primary" href="${esc(action.href)}">${esc(action.label)}</a></div><p class="lms-local-note">This recommendation is generated only from learning activity stored on this browser. It is a study aid, not a competency, certification or assessment decision.</p>`;
  };

  document.addEventListener('sea:study-notes-updated',renderNextBestAction);

  const lazyModules=[
    {id:'weekly-trends',src:'/lms-weekly-trends.js'},
    {id:'development-attention',src:'/lms-development-attention.js'}
  ];
  const loadedModules=new Set();

  const loadDashboardModule=module=>{
    if(loadedModules.has(module.src)||document.querySelector(`script[src="${module.src}"]`))return;
    const section=document.getElementById(module.id);
    if(!section)return;
    loadedModules.add(module.src);
    section.setAttribute('aria-busy','true');
    const script=document.createElement('script');
    script.src=module.src;
    script.async=true;
    script.dataset.lmsLazyModule=module.id;
    script.addEventListener('load',()=>{
      section.removeAttribute('aria-busy');
      section.querySelector('[data-lms-load-error]')?.remove();
    },{once:true});
    script.addEventListener('error',()=>{
      section.removeAttribute('aria-busy');
      loadedModules.delete(module.src);
      script.remove();
      if(section.querySelector('[data-lms-load-error]'))return;
      const notice=document.createElement('div');
      notice.className='lms-local-note';
      notice.dataset.lmsLoadError='';
      notice.setAttribute('role','status');
      notice.textContent='This dashboard section could not load. ';
      const retry=document.createElement('button');
      retry.type='button';
      retry.className='btn btn-secondary';
      retry.textContent='Retry section';
      retry.addEventListener('click',()=>{notice.remove();loadDashboardModule(module);});
      notice.appendChild(retry);
      section.appendChild(notice);
    },{once:true});
    document.body.appendChild(script);
  };

  const setupLazyModules=()=>{
    const loadHashTarget=()=>{
      const id=decodeURIComponent((location.hash||'').slice(1));
      const module=lazyModules.find(item=>item.id===id);
      if(module)loadDashboardModule(module);
    };
    loadHashTarget();
    window.addEventListener('hashchange',loadHashTarget);
    if(!('IntersectionObserver' in window)){
      lazyModules.forEach(loadDashboardModule);
      return;
    }
    const lazyObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const module=lazyModules.find(item=>item.id===entry.target.id);
        if(module)loadDashboardModule(module);
        lazyObserver.unobserve(entry.target);
      });
    },{rootMargin:'800px 0px',threshold:0.01});
    lazyModules.forEach(module=>{
      const section=document.getElementById(module.id);
      if(section)lazyObserver.observe(section);
    });
  };

  const enhanceDashboard=()=>{
    enhanceResumeTarget();
    renderNextBestAction();
    setupLazyModules();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceDashboard,{once:true});
  else enhanceDashboard();
})();
