(()=>{
  const ACCOUNT_KEY='sea_account_v2';
  const BACKUP_META_KEY='sea_lms_backup_meta';
  const LMS_PREFIX='sea_lms_';
  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const formatWhen=(iso)=>{if(!iso)return 'Not yet';const d=new Date(iso);return Number.isNaN(d.getTime())?'Unknown':d.toLocaleString([], {dateStyle:'medium',timeStyle:'short'})};
  const countLmsSets=()=>{let n=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k.startsWith(LMS_PREFIX)&&k!==BACKUP_META_KEY)n++}return n};
  const render=()=>{
    const controls=document.querySelector('[data-lms-export]')?.closest('.panel');
    if(!controls||document.querySelector('[data-lms-recovery-readiness]'))return;
    const meta=read(BACKUP_META_KEY);
    const account=read(ACCOUNT_KEY)||{};
    const panel=document.createElement('section');
    panel.className='panel';
    panel.id='recovery-readiness';
    panel.dataset.lmsRecoveryReadiness='';
    const learnerStatus=meta?.lastBackupAt?'Portable backup recorded':'Portable backup not recorded';
    const learnerDetail=meta?.lastBackupAt?`Last complete learner backup state: ${formatWhen(meta.lastBackupAt)}. Use the Learning Data Controls below to export a fresh portable JSON copy when recommended.`:'Your learning record currently exists only in this browser. Export a complete learner backup so enrolments, quiz attempts, logbook entries, goals and development history can be restored later.';
    panel.innerHTML=`<h2>Recovery readiness</h2><p class="lms-local-note">See which parts of Sajjad's Engineering Academy are protected by repository recovery and which learner records still depend on this browser.</p><div class="lms-list"><div class="lms-item"><div class="lms-item-icon">SITE</div><div><h3>Website &amp; LMS source</h3><p><strong>Repository recovery configured</strong> · GitHub version history plus scheduled disaster-recovery packaging preserve the deployable site source and full Git history.</p></div></div><div class="lms-item"><div class="lms-item-icon">DATA</div><div><h3>Your browser-local learning record</h3><p><strong>${learnerStatus}</strong> · ${learnerDetail}</p></div></div><div class="lms-item"><div class="lms-item-icon">SYNC</div><div><h3>Central learner database</h3><p><strong>Not connected yet</strong> · Cross-device synchronization and administrator-side learner recovery will require the future production LMS backend.</p></div></div></div><p class="lms-local-note"><strong>Recovery boundary:</strong> restoring the website repository does not restore browser-local learner progress. Keep a portable learner backup separately until centralized storage is introduced. Current browser contains ${countLmsSets()} SEA LMS data set${countLmsSets()===1?'':'s'}${account.email?` for ${account.email}`:''}.</p>`;
    controls.insertAdjacentElement('beforebegin',panel);
    const nav=document.querySelector('.side-nav');
    if(nav&&!nav.querySelector('a[href="#recovery-readiness"]')){
      const a=document.createElement('a');a.href='#recovery-readiness';a.textContent='Recovery Readiness';
      const activity=nav.querySelector('a[href="#activity"]');
      if(activity)nav.insertBefore(a,activity);else nav.appendChild(a);
    }
  };
  document.addEventListener('DOMContentLoaded',render);
})();
