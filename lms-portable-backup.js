(()=>{
  const ACCOUNT_KEY='sea_account_v2';
  const LMS_PREFIX='sea_lms_';
  const FORMAT='sea-portable-learning-backup';
  const VERSION=1;
  const MAX_FILE_BYTES=8*1024*1024;
  const MAX_KEYS=100;
  const MAX_VALUE_BYTES=2*1024*1024;

  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const announce=(message)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const learnerEmail=()=>String(read(ACCOUNT_KEY)?.email||'').trim().toLowerCase();
  const safeKey=(key)=>typeof key==='string'&&key.startsWith(LMS_PREFIX)&&/^sea_lms_[a-z0-9_-]+$/i.test(key);

  const collect=()=>{
    const storage={};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!safeKey(key))continue;
      const raw=localStorage.getItem(key);
      if(raw==null)continue;
      try{storage[key]=JSON.parse(raw)}catch{/* Ignore corrupt/unrelated local values rather than exporting invalid state. */}
    }
    return storage;
  };

  const download=()=>{
    const email=learnerEmail();
    const storage=collect();
    const payload={
      format:FORMAT,
      version:VERSION,
      exportedAt:new Date().toISOString(),
      learner:{email:email||null,name:read(ACCOUNT_KEY)?.name||null},
      storage
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const stamp=new Date().toISOString().slice(0,10);
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`SEA-complete-learning-backup-${stamp}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    announce(`Complete learner backup exported with ${Object.keys(storage).length} LMS data sets.`);
  };

  const validatePayload=(payload)=>{
    if(!payload||payload.format!==FORMAT||Number(payload.version)!==VERSION)throw new Error('Unsupported backup format');
    if(!payload.storage||typeof payload.storage!=='object'||Array.isArray(payload.storage))throw new Error('Missing storage map');
    const keys=Object.keys(payload.storage);
    if(!keys.length||keys.length>MAX_KEYS)throw new Error('Invalid storage key count');
    for(const key of keys){
      if(!safeKey(key))throw new Error('Unsafe storage key');
      const encoded=JSON.stringify(payload.storage[key]);
      if(encoded.length>MAX_VALUE_BYTES)throw new Error('Storage value too large');
      JSON.parse(encoded);
    }
    return keys;
  };

  const restore=(file,input)=>{
    if(file.size>MAX_FILE_BYTES){announce('Complete backup file is too large to restore. No data was changed.');input.value='';return}
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const payload=JSON.parse(String(reader.result||''));
        const keys=validatePayload(payload);
        const currentEmail=learnerEmail();
        const backupEmail=String(payload?.learner?.email||'').trim().toLowerCase();
        if(currentEmail&&backupEmail&&currentEmail!==backupEmail){
          announce('This complete backup belongs to a different learner account and was not restored.');
          input.value='';return;
        }
        const message=`Restore ${keys.length} SEA LMS data sets from this backup? Matching local LMS data will be replaced. Your sign-in/session data is not changed.`;
        if(!confirm(message)){input.value='';return}
        const prepared=keys.map(key=>[key,JSON.stringify(payload.storage[key])]);
        prepared.forEach(([key,value])=>localStorage.setItem(key,value));
        announce('Complete learner backup restored successfully. Reloading dashboard…');
        setTimeout(()=>location.reload(),350);
      }catch(err){
        announce('This file is not a valid complete SEA learner backup. No data was changed.');
      }finally{input.value=''}
    };
    reader.onerror=()=>{announce('The complete backup file could not be read. No data was changed.');input.value=''};
    reader.readAsText(file);
  };

  document.addEventListener('DOMContentLoaded',()=>{
    const exportBtn=document.querySelector('[data-lms-portable-export]');
    const importBtn=document.querySelector('[data-lms-portable-import]');
    const input=document.querySelector('[data-lms-portable-import-file]');
    exportBtn?.addEventListener('click',download);
    if(importBtn&&input){
      importBtn.addEventListener('click',()=>input.click());
      input.addEventListener('change',()=>{const file=input.files&&input.files[0];if(file)restore(file,input)});
    }
  });
})();
