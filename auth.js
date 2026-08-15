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

  const accountStyles=()=>{
    if(document.getElementById('sea-account-styles')) return;
    const style=document.createElement('style');
    style.id='sea-account-styles';
    style.textContent=`
      .sea-account-actions{display:flex;align-items:center;gap:8px;margin-left:auto;white-space:nowrap}
      .sea-account-link{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:8px 13px;border-radius:9px;text-decoration:none;font:700 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.01em;transition:.2s ease}
      .sea-signin{color:#dcebf4;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.03)}
      .sea-signup{color:#04131d;background:#63dcff;border:1px solid #63dcff}
      .sea-account-chip{display:flex;align-items:center;gap:9px;max-width:270px;padding:7px 9px 7px 11px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.04);color:#dcebf4;font:12px/1.2 system-ui,-apple-system,Segoe UI,sans-serif}
      .sea-account-chip strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px}
      .sea-signout{border:0;background:none;color:#63dcff;cursor:pointer;padding:2px 3px;font:700 11px/1 system-ui,-apple-system,Segoe UI,sans-serif}
      .sea-account-floating{position:fixed;top:16px;right:16px;z-index:9999;background:#07131f;padding:8px;border:1px solid rgba(255,255,255,.14);border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.25)}
      @media(max-width:980px){.sea-account-actions{gap:6px}.sea-account-link{padding:8px 10px}.sea-account-chip{max-width:210px}}
      @media(max-width:760px){.sea-account-actions{width:100%;margin:8px 0 0;justify-content:flex-end}.sea-account-chip{max-width:100%}}
    `;
    document.head.appendChild(style);
  };

  const mountAccountUI=()=>{
    accountStyles();
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
