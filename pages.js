const main=document.querySelector('main');
if(main&&!main.id)main.id='main-content';
if(main&&!document.querySelector('.skip-link')){
  const skipLink=document.createElement('a');
  skipLink.className='skip-link';
  skipLink.href='#main-content';
  skipLink.textContent='Skip to main content';
  document.body.insertAdjacentElement('afterbegin',skipLink);
}

const menu=document.querySelector('.menu');
const links=document.querySelector('.nav-links');

if(links&&!links.hasAttribute('aria-label'))links.setAttribute('aria-label','Primary navigation');

if(links&&!links.querySelector('a[href="/tools/"]')){
  const toolsLink=document.createElement('a');
  toolsLink.href='/tools/';
  toolsLink.textContent='Tools';
  toolsLink.setAttribute('aria-label','Engineering calculators and practical tools');
  const guidesLink=[...links.querySelectorAll('a')].find(a=>/guides\/?$/i.test(a.getAttribute('href')||''));
  if(guidesLink)guidesLink.insertAdjacentElement('afterend',toolsLink);
  else links.prepend(toolsLink);
}

if(menu&&links){
  if(!links.id)links.id='primary-navigation';
  menu.setAttribute('aria-controls',links.id);
  menu.setAttribute('aria-expanded','false');
  menu.setAttribute('aria-label','Open navigation');
  const closeMenu=(returnFocus=false)=>{
    links.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
    if(returnFocus)menu.focus();
  };
  menu.addEventListener('click',()=>{
    const open=links.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  });
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
  document.addEventListener('pointerdown',e=>{
    if(links.classList.contains('open')&&!links.contains(e.target)&&!menu.contains(e.target))closeMenu();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&links.classList.contains('open'))closeMenu(true);
  });
  const desktopView=window.matchMedia('(min-width: 821px)');
  const closeOnDesktop=e=>{
    if(e.matches&&links.classList.contains('open'))closeMenu();
  };
  if(desktopView.addEventListener)desktopView.addEventListener('change',closeOnDesktop);
  else desktopView.addListener(closeOnDesktop);
}

document.querySelectorAll('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());

document.querySelectorAll('.chip').forEach(chip=>chip.addEventListener('click',()=>{
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
  chip.classList.add('active');
  const value=chip.dataset.filter;
  document.querySelectorAll('[data-category]').forEach(card=>card.style.display=value==='all'||card.dataset.category===value?'block':'none');
}));

const form=document.querySelector('#contactForm');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const name=form.querySelector('[name=name]').value;
    window.location.href=`mailto:info@sajjadengineeringacademy.com?subject=${encodeURIComponent('Academy enquiry from '+name)}&body=${encodeURIComponent(form.querySelector('[name=message]').value)}`;
  });
}
