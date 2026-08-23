(()=>{
  const ACCOUNT_KEY='sea_account_v2';
  const LMS_KEY='sea_lms_state_v1';
  const LMS_PREFIX='sea_lms_';
  const BACKUP_META_KEY='sea_lms_backup_meta';
  const FORMAT='sea-portable-learning-backup';
  const VERSION=1;
  const MAX_FILE_BYTES=8*1024*1024;
  const MAX_KEYS=100;
  const MAX_VALUE_BYTES=2*1024*1024;
  const REMINDER_ACTIVITY_THRESHOLD=3;
  const REMINDER_AGE_DAYS=7;

  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const announce=(message)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=message};
  const email=()=>String(read(ACCOUNT_KEY)?.email||'').trim().toLowerCase();
  const safeKey=(key)=>typeof key==='string'&&key.startsWith(LMS_PREFIX)&&/^sea_lms_[a-z0-9_-]+$/i.test(key);
  const formatWhen=(iso)=>{if(!iso)return 'Not yet';const d=new Date(iso);return Number.isNaN(d.getTime())?'Unknown':d.toLocaleString([], {dateStyle:'medium',timeStyle:'short'})};

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
      if(!safeKey(key)||key===BACKUP_META_KEY)continue;
      const raw=localStorage.getItem(key);
      if(raw==null)continue;
      try{storage[key]=JSON.parse(raw)}catch{/* Skip corrupt local values. */}
    }
    return storage;
  };

  const stableStringify=(value)=>{
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(stableStringify).join(',')+']';
    return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stableStringify(value[key])).join(',')+'}';
  };
  const fingerprint=(storage)=>{
    const text=stableStringify(storage);
    let hash=2166136261;
    for(let i=0;i<text.length;i++){
      hash^=text.charCodeAt(i);
      hash=Math.imul(hash,16777619);
    }
    return (hash>>>0).toString(16).padStart(8,'0');
  };
  const activityUnits=(value)=>{
    let count=0;
    const seen=new Set();
    const walk=(node)=>{
      if(!node||typeof node!=='object'||seen.has(node))return;
      seen.add(node);
      if(Array.isArray(node)){node.forEach(walk);return}
      const keys=Object.keys(node);
      if(keys.some(k=>/^(at|createdAt|completedAt|submittedAt|loggedAt|attemptedAt|updatedAt)$/i.test(k))){count++}
      keys.forEach(k=>walk(node[k]));
    };
    walk(value);
    return count;
  };
  const storageActivityUnits=(storage)=>Object.values(storage).reduce((sum,value)=>sum+activityUnits(value),0);
  const daysSince=(iso)=>{
    const d=new Date(iso||'');
    if(Number.isNaN(d.getTime()))return Infinity;
    return Math.max(0,(Date.now()-d.getTime())/86400000);
  };
  const writeBackupMeta=(meta)=>localStorage.setItem(BACKUP_META_KEY,JSON.stringify(meta));

  const renderBackupHealth=()=>{
    const exportBtn=document.querySelector('[data-lms-export]');
    const panel=exportBtn?.closest('.panel');
    if(!panel)return;
    let box=panel.querySelector('[data-lms-backup-health]');
    if(!box){
      box=document.createElement('div');
      box.dataset.lmsBackupHealth='';
      box.className='notice';
      const note=panel.querySelector('.lms-local-note');
      if(note)note.insertAdjacentElement('beforebegin',box);else panel.appendChild(box);
    }
    const storage=collectStorage();
    const currentHash=fingerprint(storage);
    const currentUnits=storageActivityUnits(storage);
    const meta=read(BACKUP_META_KEY);
    if(!meta?.hash){
      box.innerHTML='<strong>Backup health:</strong> No complete learner backup has been recorded on this browser yet. Export one now so you have a portable recovery copy.';
      return;
    }
    const current=meta.hash===currentHash;
    const unitsSince=Math.max(0,currentUnits-Number(meta.activityUnits||0));
    const ageDays=daysSince(meta.lastBackupAt);
    const meaningful=unitsSince>=REMINDER_ACTIVITY_THRESHOLD||(!current&&ageDays>=REMINDER_AGE_DAYS);
    const label=current?'Current':meaningful?'Backup recommended':'Recent changes saved';
    let detail='Your browser-local LMS record matches the last recorded backup state.';
    if(!current&&!meaningful)detail=`Your learner record has changed, but only ${unitsSince} new recorded learning action${unitsSince===1?'':'s'} have accumulated. A new backup will be recommended after ${REMINDER_ACTIVITY_THRESHOLD} recorded actions or ${REMINDER_AGE_DAYS} days.`;
    if(!current&&meaningful)detail=`Your learner record has meaningful changes since the last backup (${unitsSince} new recorded learning action${unitsSince===1?'':'s'}${ageDays>=REMINDER_AGE_DAYS?`, ${Math.floor(ageDays)} days since backup`:''}). Export a fresh copy to preserve the latest progress.`;
    box.innerHTML=`<strong>Backup health: ${label}</strong><br>Last backup state: ${formatWhen(meta.lastBackupAt)} · ${meta.keyCount||Object.keys(storage).length} LMS data sets.<br>${detail}`;
  };

  const exportComplete=()=>{
    const account=read(ACCOUNT_KEY)||{};
    const storage=collectStorage();
    const exportedAt=new Date().toISOString();
    const stateHash=fingerprint(storage);
    const activityCount=storageActivityUnits(storage);
    const payload={
      format:FORMAT,
      version:VERSION,
      exportedAt,
      learner:{email:account.email||null,name:account.name||null},
      storage
    };
    let url='';
    try{
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      url=URL.createObjectURL(blob);a.href=url;
      a.download=`SEA-complete-learning-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.hidden=true;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      writeBackupMeta({lastBackupAt:exportedAt,hash:stateHash,keyCount:Object.keys(storage).length,activityUnits:activityCount,source:'export'});
      renderBackupHealth();
      announce(`Complete learner backup exported with ${Object.keys(storage).length} LMS data sets.`);
    }catch{
      if(url)URL.revokeObjectURL(url);
      announce('Complete learner backup could not start. Your backup status was not changed; please try again or use another browser.');
    }
  };

  const validateComplete=(payload)=>{
    if(payload?.format!==FORMAT||Number(payload?.version)!==VERSION) return null;
    if(!payload.storage||typeof payload.storage!=='object'||Array.isArray(payload.storage))throw new Error('Invalid storage map');
    const keys=Object.keys(payload.storage);
    if(!keys.length||keys.length>MAX_KEYS)throw new Error('Invalid storage key count');
    keys.forEach(key=>{
      if(!safeKey(key)||key===BACKUP_META_KEY)throw new Error('Unsafe storage key');
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
    const previous=keys.map(key=>[key,localStorage.getItem(key)]);
    try{
      prepared.forEach(([key,value])=>localStorage.setItem(key,value));
      writeBackupMeta({lastBackupAt:payload.exportedAt||new Date().toISOString(),hash:fingerprint(payload.storage),keyCount:keys.length,activityUnits:storageActivityUnits(payload.storage),source:'restore',restoredAt:new Date().toISOString()});
    }catch{
      previous.forEach(([key,value])=>{if(value==null)localStorage.removeItem(key);else localStorage.setItem(key,value)});
      announce('Complete learner backup could not be restored. Your previous browser-local LMS data was retained.');
      return false;
    }
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
    localStorage.removeItem(BACKUP_META_KEY);
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
    if(note)note.innerHTML=`<strong>Complete portable backup:</strong> export includes all SEA browser-local LMS data sets, including enrolments, module progress, quiz attempts, practical logbook, goals, role plans, learning-plan history, and study-strategy analytics. The backup-health indicator recommends a fresh export after ${REMINDER_ACTIVITY_THRESHOLD} new recorded learning actions or ${REMINDER_AGE_DAYS} days with unsaved changes, instead of prompting after every small update. Restore validates the file and learner email before replacing matching LMS data. Sign-in/session data is never imported. Older core-only SEA backups remain supported.`;
    renderBackupHealth();
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
