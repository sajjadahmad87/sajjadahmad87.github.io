(()=>{
  const KEY='sea_registered_user_v1';
  const script=document.currentScript;
  const requiresAuth=script?.hasAttribute('data-protect');
  const getUser=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
  const currentTarget=()=>location.pathname+location.search+location.hash;
  const registerUrl=(target)=>'/register.html?return='+encodeURIComponent(target||'/resources.html');
  const isProtectedHref=(href)=>{
    try{
      const u=new URL(href,location.href);
      if(u.origin!==location.origin) return false;
      return /(^|\/)(resources\.html|guides(?:\/|$)|downloads(?:\/|$))/.test(u.pathname);
    }catch{return false}
  };
  const redirectToRegister=()=>location.replace(registerUrl(currentTarget()));

  if(requiresAuth&&!getUser()){
    redirectToRegister();
    return;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const user=getUser();

    document.addEventListener('click',e=>{
      const a=e.target.closest('a[href]');
      if(!a||user||!isProtectedHref(a.href)) return;
      e.preventDefault();
      location.href=registerUrl(new URL(a.href,location.href).pathname+new URL(a.href,location.href).search+new URL(a.href,location.href).hash);
    });

    const form=document.getElementById('seaRegistrationForm');
    if(form){
      const existing=getUser();
      const existingBox=document.getElementById('existingRegistration');
      if(existing&&existingBox){
        existingBox.hidden=false;
        const existingName=existingBox.querySelector('[data-existing-name]');
        if(existingName) existingName.textContent=existing.name||existing.email||'Registered learner';
      }
      form.addEventListener('submit',e=>{
        e.preventDefault();
        const data=new FormData(form);
        const profile={
          name:String(data.get('name')||'').trim(),
          email:String(data.get('email')||'').trim().toLowerCase(),
          discipline:String(data.get('discipline')||'').trim(),
          country:String(data.get('country')||'').trim(),
          registeredAt:new Date().toISOString()
        };
        if(!profile.name||!profile.email) return;
        localStorage.setItem(KEY,JSON.stringify(profile));
        const params=new URLSearchParams(location.search);
        let target=params.get('return')||'/resources.html';
        if(!target.startsWith('/')||target.startsWith('//')) target='/resources.html';
        location.href=target;
      });
    }

    document.querySelectorAll('[data-sea-continue]').forEach(el=>el.addEventListener('click',()=>{
      const params=new URLSearchParams(location.search);
      let target=params.get('return')||'/resources.html';
      if(!target.startsWith('/')||target.startsWith('//')) target='/resources.html';
      location.href=target;
    }));

    if(user&&requiresAuth){
      const bar=document.createElement('div');
      bar.setAttribute('role','status');
      bar.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9999;background:#07131f;color:#dcebf4;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 12px;font:12px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.25)';
      const name=document.createElement('span');
      name.textContent='Registered: '+(user.name||user.email);
      const sep=document.createTextNode(' · ');
      const out=document.createElement('button');
      out.type='button';out.textContent='Sign out';
      out.style.cssText='background:none;border:0;color:#66d9ff;text-decoration:underline;cursor:pointer;padding:0;font:inherit';
      out.addEventListener('click',()=>{localStorage.removeItem(KEY);location.href='/register.html?return='+encodeURIComponent(currentTarget())});
      bar.append(name,sep,out);document.body.appendChild(bar);
    }
  });
})();
