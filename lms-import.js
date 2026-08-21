(()=>{
  const ACCOUNT_KEY='sea_account_v2';
  const LMS_KEY='sea_lms_state_v1';
  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const announce=(message)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const validLearning=(x)=>{
    if(!x||typeof x!=='object'||Array.isArray(x)) return false;
    if(x.enrolled!=null&&(typeof x.enrolled!=='object'||Array.isArray(x.enrolled))) return false;
    if(x.saved!=null&&!Array.isArray(x.saved)) return false;
    if(x.progress!=null&&(typeof x.progress!=='object'||Array.isArray(x.progress))) return false;
    if(x.activity!=null&&!Array.isArray(x.activity)) return false;
    return true;
  };
  const normalize=(x)=>({
    ...x,
    enrolled:x.enrolled&&typeof x.enrolled==='object'?x.enrolled:{},
    saved:Array.isArray(x.saved)?x.saved:[],
    progress:x.progress&&typeof x.progress==='object'?x.progress:{},
    activity:Array.isArray(x.activity)?x.activity.slice(0,40):[],
    restoredAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.querySelector('[data-lms-import]');
    const input=document.querySelector('[data-lms-import-file]');
    if(!btn||!input)return;
    btn.addEventListener('click',()=>input.click());
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];
      if(!file)return;
      if(file.size>5*1024*1024){announce('Backup file is too large to restore.');input.value='';return}
      const reader=new FileReader();
      reader.onload=()=>{
        try{
          const payload=JSON.parse(String(reader.result||''));
          const learning=payload&&payload.learning;
          if(!validLearning(learning)) throw new Error('Invalid learning backup structure');
          const current=read(ACCOUNT_KEY);
          const exportedEmail=String(payload?.account?.email||'').trim().toLowerCase();
          const currentEmail=String(current?.email||'').trim().toLowerCase();
          if(exportedEmail&&currentEmail&&exportedEmail!==currentEmail){
            announce('This backup belongs to a different learner account and was not restored.');
            input.value='';return;
          }
          if(!confirm('Restore this SEA learning-progress backup on this browser? Existing core LMS progress will be replaced. Practical logbook data is not changed.')){input.value='';return}
          localStorage.setItem(LMS_KEY,JSON.stringify(normalize(learning)));
          announce('Learning progress restored successfully. Reloading dashboard…');
          setTimeout(()=>location.reload(),350);
        }catch(err){
          announce('This file is not a valid SEA learning-progress backup. No data was changed.');
        }finally{input.value=''}
      };
      reader.onerror=()=>{announce('The backup file could not be read. No data was changed.');input.value=''};
      reader.readAsText(file);
    });
  });
})();
