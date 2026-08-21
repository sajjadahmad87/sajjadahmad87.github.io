(()=>{
  const root=document.querySelector('[data-lms-dashboard]');
  const nav=document.querySelector('.side-nav');
  if(!root||!nav)return;

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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceResumeTarget,{once:true});
  else enhanceResumeTarget();
})();
