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
})();
