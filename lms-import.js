(()=>{
  const ACCOUNT_KEY='sea_account_v2';
  const LMS_KEY='sea_lms_state_v1';
  const LMS_PREFIX='sea_lms_';
  const FORMAT='sea-portable-learning-backup';
  const VERSION=1;
  const MAX_FILE_BYTES=8*1024*1024;
  const MAX_KEYS=100;
  const MAX_VALUE_BYTES=2*1024*1024;

  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const announce=(message)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const email=()=>String(read(ACCOUNT_KEY)?.email||'').trim().toLowerCase();
  const safeKey=(key)=>typeof key==='string'&&key.startsWith(LMS_PREFIX)&&/^sea_lms_[a-z0-9_-]+$/i.test(key);

  const validLearning=(x)=>{
    if(!x||typeof x!=='object'||Array.isArray(x)) return false;
    if(x.enrolled!=null&&(typeof x.enrolled!=='object'||Array.isArray(x.enrolled))) return false;
    if(x.saved!=null&&!Array.isArray(x.saved)) return false;
    if(x.progress!=null&&(typeof x.progress!=='object'||Array.isArray(x.progress))) return false;
    if(x.activity!=null&&!Array.isArray(x.activity)) return false;
    return true;
  };
  const normalizeLearning=(x)=>({
    ...x,
    enrolled:x.enrolled&&typeof x.enrolled==='object'?x.enrolled:{},
    saved:Array.isArray(x.saved)?x.saved:[],
    progress:x.progress&&typeof x.progress==='object'?x.progress:{},
    activity:Array.isArray(x.activity)?x.activity.slice(0,40):[],
    restoredAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  });

  const collectStorage=()=>{
    const storage={};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!safeKey(key))continue;
      const raw=localStorage.getItem(key);
      if(raw==null)continue;
      try{storage[key]=JSON.parse(raw)}catch{/* Skip corrupt local values. */}
    }
    return storage;
  };

  const exportComplete=()=>{
    const account=read(ACCOUNT_KEY)||{};
    const storage=collectStorage();
    const payload={
      format:FORMAT,
      version:VERSION,
      exportedAt:new Date().toISOString(),
      learner:{email:account.email||null,name:account.name||null},
      storage
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`SEA-complete-learning-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    announce(`Complete learner backup exported with ${Object.keys(storage).length} LMS data sets.`);
  };

  const validateComplete=(payload)=>{
    if(payload?.format!==FORMAT||Number(payload?.version)!==VERSION) return null;
    if(!payload.storage||typeof payload.storage!=='object'||Array.isArray(payload.storage))throw new Error('Invalid storage map');
    const keys=Object.keys(payload.storage);
    if(!keys.length||keys.length>MAX_KEYS)throw new Error('Invalid storage key count');
    keys.forEach(key=>{
      if(!safeKey(key))throw new Error('Unsafe storage key');
      const encoded=JSON.stringify(payload.storage[key]);
      if(encoded.length>MAX_VALUE_BYTES)throw new Error('Storage value too large');
      JSON.parse(encoded);
    });
    return keys;
  };

  const restoreComplete=(payload,keys)=>{
    const currentEmail=email();
    const backupEmail=String(payload?.learner?.email||'').trim().toLowerCase();
    if(currentEmail&&backupEmail&&currentEmail!==backupEmail){
      announce('This complete backup belongs to a different learner account and was not restored.');
      return false;
    }
    if(!confirm(`Restore ${keys.length} SEA LMS data sets from this complete backup? Matching local LMS data will be replaced. Your sign-in/session data is not changed.`))return false;
    const prepared=keys.map(key=>[key,JSON.stringify(payload.storage[key])]);
    prepared.forEach(([key,value])=>localStorage.setItem(key,value));
    announce('Complete learner backup restored successfully. Reloading dashboard…');
    setTimeout(()=>location.reload(),350);
    return true;
  };

  const restoreLegacy=(payload)=>{
    const learning=payload&&payload.learning;
    if(!validLearning(learning))throw new Error('Invalid legacy learning backup');
    const currentEmail=email();
    const backupEmail=String(payload?.account?.email||'').trim().toLowerCase();
    if(currentEmail&&backupEmail&&currentEmail!==backupEmail){
      announce('This backup belongs to a different learner account and was not restored.');
      return false;
    }
    if(!confirm('Restore this older SEA core learning-progress backup? Existing core LMS progress will be replaced; newer auxiliary LMS data will remain unchanged.'))return false;
    localStorage.setItem(LMS_KEY,JSON.stringify(normalizeLearning(learning)));
    announce('Older core learning-progress backup restored successfully. Reloading dashboard…');
    setTimeout(()=>location.reload(),350);
    return true;
  };

  document.addEventListener('DOMContentLoaded',()=>{
    const exportBtn=document.querySelector('[data-lms-export]');
    const importBtn=document.querySelector('[data-lms-import]');
    const input=document.querySelector('[data-lms-import-file]');
    if(exportBtn){
      exportBtn.textContent='Export complete learner backup';
      exportBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();exportComplete()});
    }
    if(importBtn)importBtn.textContent='Restore learner backup';
    const panel=exportBtn?.closest('.panel');
    const note=panel?.querySelector('.lms-local-note');
    if(note)note.innerHTML='<strong>Complete portable backup:</strong> export now includes all SEA browser-local LMS data sets, including enrolments, module progress, quiz attempts, practical logbook, goals, role plans, learning-plan history, and study-strategy analytics. Restore validates the file and learner email before replacing matching LMS data. Sign-in/session data is never imported. Older core-only SEA backups remain supported.';
    if(!importBtn||!input)return;
    importBtn.addEventListener('click',()=>input.click());
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];
      if(!file)return;
      if(file.size>MAX_FILE_BYTES){announce('Backup file is too large to restore. No data was changed.');input.value='';return}
      const reader=new FileReader();
      reader.onload=()=>{
        try{
          const payload=JSON.parse(String(reader.result||''));
          const keys=validateComplete(payload);
          if(keys)restoreComplete(payload,keys);else restoreLegacy(payload);
        }catch(err){
          announce('This file is not a valid SEA learner backup. No data was changed.');
        }finally{input.value=''}
      };
      reader.onerror=()=>{announce('The backup file could not be read. No data was changed.');input.value=''};
      reader.readAsText(file);
    });
  });
})();
