(()=>{
  const ACCOUNT_KEY='sea_account_v2';
  const SESSION_KEY='sea_session_v2';
  const LMS_KEY='sea_lms_state_v1';
  const status=document.querySelector('#catalogActionStatus');
  if(!status)return;

  const showStatus=(message,isError=false)=>{
    status.textContent=message;
    status.classList.remove('hidden');
    status.setAttribute('role',isError?'alert':'status');
    status.setAttribute('aria-live',isError?'assertive':'polite');
    if(isError)status.focus();
  };
  const readJson=key=>{
    try{return {ok:true,value:JSON.parse(localStorage.getItem(key)||'null')}}
    catch{return {ok:false,value:null}}
  };
  const activeSession=()=>{
    const account=readJson(ACCOUNT_KEY),session=readJson(SESSION_KEY);
    if(!account.ok||!session.ok)return {ok:false,storageError:true};
    const email=String(account.value?.email||'').trim().toLowerCase();
    const sessionEmail=String(session.value?.email||'').trim().toLowerCase();
    return {ok:!!email&&email===sessionEmail,storageError:false};
  };
  const restore=(before)=>{
    try{
      if(before===null)localStorage.removeItem(LMS_KEY);else localStorage.setItem(LMS_KEY,before);
      return localStorage.getItem(LMS_KEY)===before;
    }catch{return false}
  };
  const transact=mutate=>{
    let before;
    try{before=localStorage.getItem(LMS_KEY)}catch{return {ok:false}}
    let state;
    try{state=before?JSON.parse(before):{}}
    catch{return {ok:false}}
    if(!state||typeof state!=='object'||Array.isArray(state))return {ok:false};
    state.enrolled=state.enrolled&&typeof state.enrolled==='object'&&!Array.isArray(state.enrolled)?state.enrolled:{};
    state.saved=Array.isArray(state.saved)?state.saved:[];
    state.progress=state.progress&&typeof state.progress==='object'&&!Array.isArray(state.progress)?state.progress:{};
    state.activity=Array.isArray(state.activity)?state.activity:[];
    const value=mutate(state);
    state.activity=state.activity.slice(0,40);
    state.updatedAt=new Date().toISOString();
    const serialized=JSON.stringify(state);
    try{
      localStorage.setItem(LMS_KEY,serialized);
      if(localStorage.getItem(LMS_KEY)!==serialized)throw new Error('Unverified browser storage write');
      return {ok:true,value};
    }catch{
      restore(before);
      return {ok:false};
    }
  };
  const storageError=()=>showStatus('The change could not be verified in browser storage, so the catalog control was not updated. Check browser storage permissions, reload, and try again.',true);
  const requireLogin=()=>{location.href='/signin.html?return='+encodeURIComponent(location.pathname+location.search+location.hash)};

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.lms-action-row button');
    if(!button)return;
    event.stopImmediatePropagation();
    const card=button.closest('.course-card');
    if(!card?.id)return;
    const session=activeSession();
    if(session.storageError)return storageError();
    if(!session.ok)return requireLogin();
    const title=card.dataset.title||'learning path';

    if(button.classList.contains('lms-save')){
      const result=transact(state=>{
        const saved=[...new Set(state.saved.filter(id=>typeof id==='string'))];
        const index=saved.indexOf(card.id);
        const on=index<0;
        if(on)saved.unshift(card.id);else saved.splice(index,1);
        state.saved=saved;
        state.activity.unshift({type:on?'saved':'unsaved',courseId:card.id,label:(on?'Saved ':'Removed from saved: ')+title,at:new Date().toISOString()});
        return on;
      });
      if(!result.ok)return storageError();
      button.setAttribute('aria-pressed',String(result.value));
      button.textContent=result.value?'Saved ★':'Save ☆';
      return showStatus(result.value?`${title} saved to My Learning.`:`${title} removed from saved paths.`);
    }

    const result=transact(state=>{
      const already=!!state.enrolled[card.id];
      if(!already){
        state.enrolled[card.id]={enrolledAt:new Date().toISOString(),lastOpenedAt:new Date().toISOString()};
        state.activity.unshift({type:'enrolled',courseId:card.id,label:'Enrolled in '+title,at:new Date().toISOString()});
      }
      return already;
    });
    if(!result.ok)return storageError();
    button.textContent='Enrolled ✓';
    showStatus(result.value?`You are already enrolled in ${title}.`:`Enrolled in ${title}. Progress is saved in this browser.`);
  },true);
})();
