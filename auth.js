(()=>{
  const LEGACY_KEY='sea_registered_user_v1';
  const ACCOUNT_KEY='sea_account_v2';
  const SESSION_KEY='sea_session_v2';
  const script=document.currentScript;
  // Public courses and engineering guides remain open for discovery and SEO.
  // The resource hub, structured resource libraries and direct downloads require the lightweight learner sign-in gate in this static preview.
  const requiresAuth=script?.hasAttribute('data-protect');

  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const normalizeEmail=(value)=>String(value||'').trim().toLowerCase();
  const registrationConflict=(existing,profile)=>!!(normalizeEmail(existing?.email)&&normalizeEmail(profile?.email)&&normalizeEmail(existing.email)!==normalizeEmail(profile.email));
  const currentTarget=()=>location.pathname+location.search+location.hash;
  const safeReturn=()=>{
    const params=new URLSearchParams(location.search);
    let target=params.get('return')||'/resources.html';
    if(!target.startsWith('/')||target.startsWith('//')) target='/resources.html';
    return target;
  };

  // Migrate the original registration into the new account/session model.
  const legacy=read(LEGACY_KEY);
  if(legacy&&!read(ACCOUNT_KEY)) write(ACCOUNT_KEY,legacy);
  if(legacy&&!read(SESSION_KEY)) write(SESSION_KEY,{email:legacy.email,signedInAt:new Date().toISOString()});

  const getAccount=()=>read(ACCOUNT_KEY);
  const getSession=()=>read(SESSION_KEY);
  const getUser=()=>{
    const account=getAccount(), session=getSession();
    if(!account||!session||!account.email||account.email!==session.email) return null;
    return account;
  };

  const registerUrl=(target)=>'/register.html?return='+encodeURIComponent(target||'/resources.html');
  const signinUrl=(target)=>'/signin.html?return='+encodeURIComponent(target||'/resources.html');
  const isProtectedHref=(href)=>{
    try{
      const u=new URL(href,location.href);
      if(u.origin!==location.origin) return false;
      return /(^|\/)(resources\.html|resource-library(?:\/|$)|downloads(?:\/|$))/.test(u.pathname);
    }catch{return false}
  };

  if(requiresAuth&&!getUser()){
    location.replace(signinUrl(currentTarget()));
    return;
  }

  const mountAccountUI=()=>{
    document.querySelectorAll('.sea-account-actions').forEach(x=>x.remove());
    const user=getUser();
    const wrap=document.createElement('div');
    wrap.className='sea-account-actions';

    if(user){
      const chip=document.createElement('div');
      chip.className='sea-account-chip';
      const name=document.createElement('strong');
      name.textContent=user.name||user.email||'Learner';
      const out=document.createElement('button');
      out.type='button';
      out.className='sea-signout';
      out.textContent='Sign Out';
      out.addEventListener('click',()=>{
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LEGACY_KEY);
        location.href='/signin.html?return='+encodeURIComponent(currentTarget());
      });
      chip.append(name,out);
      wrap.appendChild(chip);
    }else{
      const ret=encodeURIComponent(currentTarget());
      const signIn=document.createElement('a');
      signIn.className='sea-account-link sea-signin';
      signIn.href='/signin.html?return='+ret;
      signIn.textContent='Sign In';
      const signUp=document.createElement('a');
      signUp.className='sea-account-link sea-signup';
      signUp.href='/register.html?return='+ret;
      signUp.textContent='Sign Up';
      wrap.append(signIn,signUp);
    }

    const nav=document.querySelector('.nav-inner');
    const navLinks=document.querySelector('.nav-links');
    const mobile=window.matchMedia('(max-width:760px)').matches;
    if(mobile&&navLinks){navLinks.appendChild(wrap)}
    else if(nav){nav.appendChild(wrap)}
    else{wrap.classList.add('sea-account-floating');document.body.appendChild(wrap)}
  };

  document.addEventListener('DOMContentLoaded',()=>{
    mountAccountUI();

    document.addEventListener('click',e=>{
      const a=e.target.closest('a[href]');
      if(!a||getUser()||!isProtectedHref(a.href)) return;
      e.preventDefault();
      const u=new URL(a.href,location.href);
      location.href=signinUrl(u.pathname+u.search+u.hash);
    });

    const registrationForm=document.getElementById('seaRegistrationForm');
    if(registrationForm){
      const existing=getAccount();
      const existingBox=document.getElementById('existingRegistration');
      if(existing&&existingBox){
        existingBox.hidden=false;
        const existingName=existingBox.querySelector('[data-existing-name]');
        if(existingName) existingName.textContent=existing.name||existing.email||'Registered learner';
      }
      registrationForm.addEventListener('submit',e=>{
        e.preventDefault();
        const data=new FormData(registrationForm);
        const profile={
          name:String(data.get('name')||'').trim(),
          email:String(data.get('email')||'').trim().toLowerCase(),
          discipline:String(data.get('discipline')||'').trim(),
          country:String(data.get('country')||'').trim(),
          registeredAt:new Date().toISOString()
        };
        if(!profile.name||!profile.email) return;
        if(registrationConflict(existing,profile)){
          const error=document.getElementById('registrationError');
          if(error){
            error.hidden=false;
            error.textContent='This browser already stores a learner profile and LMS records for another email. To prevent learner data from being mixed or overwritten, sign in with the existing profile or use a separate browser profile for another learner.';
            error.focus();
          }
          return;
        }
        write(ACCOUNT_KEY,profile);
        write(SESSION_KEY,{email:profile.email,signedInAt:new Date().toISOString()});
        localStorage.removeItem(LEGACY_KEY);
        location.href=safeReturn();
      });
    }

    const signinForm=document.getElementById('seaSigninForm');
    if(signinForm){
      const account=getAccount();
      const error=document.getElementById('signinError');
      const emailInput=signinForm.querySelector('[name=email]');
      if(account?.email&&emailInput) emailInput.value=account.email;
      signinForm.addEventListener('submit',e=>{
        e.preventDefault();
        const email=String(new FormData(signinForm).get('email')||'').trim().toLowerCase();
        if(account&&email===String(account.email||'').toLowerCase()){
          write(SESSION_KEY,{email:account.email,signedInAt:new Date().toISOString()});
          location.href=safeReturn();
        }else if(error){
          error.hidden=false;
          error.textContent='No saved registration was found for this email on this browser. Please sign up first.';
        }
      });
    }

    document.querySelectorAll('[data-sea-continue]').forEach(el=>el.addEventListener('click',()=>{
      const account=getAccount();
      if(account) write(SESSION_KEY,{email:account.email,signedInAt:new Date().toISOString()});
      location.href=safeReturn();
    }));
  });
})();
