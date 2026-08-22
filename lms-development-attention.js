(()=>{
  const HISTORY_KEY='sea_lms_role_weekly_history_v1';
  const ROLE_KEY='sea_lms_role_target_v1';
  const SKILLS=[
    {id:'hvac',name:'HVAC Troubleshooting',quizKey:'sea_lms_quiz_v1',study:'/guides/ahu-troubleshooting/',support:'/guides/vfd-fundamentals/',quiz:'/course.html#knowledge-check'},
    {id:'rca',name:'RCA & 5-Why',quizKey:'sea_lms_quiz_rca_v1',study:'/guides/root-cause-analysis-5-why/',support:'/guides/fmea-maintenance/',quiz:'/quiz-rca.html'},
    {id:'ppm',name:'Preventive Maintenance & PPM',quizKey:'sea_lms_quiz_ppm_v1',study:'/guides/ppm-checklist/',support:'/guides/preventive-maintenance/',quiz:'/quiz-ppm.html'},
    {id:'electrical',name:'Electrical Troubleshooting',quizKey:'sea_lms_quiz_electrical_v1',study:'/guides/vfd-fundamentals/',support:'/tools/three-phase-power-calculator/',quiz:'/quiz-electrical.html'}
  ];
  const ROLES={technician:{label:'Maintenance Technician',target:65},engineer:{label:'Maintenance Engineer',target:75},lead:{label:'Senior / Lead Engineer',target:85}};
  const read=(k,f=null)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const attempts=s=>{const x=read(s.quizKey,{}),a=Array.isArray(x?.attempts)?x.attempts:[];return a.filter(v=>Number(v.total)>0).sort((a,b)=>new Date(a.at||a.completedAt||0)-new Date(b.at||b.completedAt||0));};
  const pct=a=>Math.round((Number(a?.score)||0)/(Number(a?.total)||1)*100);
  const latest=s=>{const a=attempts(s);return a.length?pct(a[a.length-1]):null;};
  const historyFor=(name,h)=>h.filter(x=>x?.skillName===name).sort((a,b)=>String(a.week||'').localeCompare(String(b.week||'')));
  const comparable=rows=>rows.filter(x=>x?.status==='Completed'&&Number.isFinite(Number(x.baseline))&&Number.isFinite(Number(x.after)));
  const deltas=rows=>comparable(rows).map(x=>Number(x.after)-Number(x.baseline));

  const analyze=(skill,history,target)=>{
    const rows=historyFor(skill.name,history),ds=deltas(rows),recent=ds.slice(-2),score=latest(skill);
    const repeated=rows.length>=2;
    const stalled=recent.length>=2&&recent.every(x=>x<=0);
    const averageDelta=ds.length?ds.reduce((a,b)=>a+b,0)/ds.length:null;
    const below=score!==null&&score<target;
    const unassessed=score===null;
    let severity=0,status='On track',reason='No repeated difficulty pattern detected from the available local learning history.';
    if(unassessed){severity=2;status='Baseline needed';reason='No saved self-assessment is available for this learning area yet.';}
    if(below){severity=Math.max(severity,3);status='Below study benchmark';reason=`Latest self-check is ${score}%, below the selected role study benchmark of ${target}%.`;}
    if(repeated){severity=Math.max(severity,2);status='Repeated priority';reason=`This area has appeared in ${rows.length} archived weekly development plans.`;}
    if(repeated&&below){severity=Math.max(severity,4);status='Repeated gap';reason=`This area has appeared in ${rows.length} weekly plans and the latest self-check remains below the ${target}% study benchmark.`;}
    if(stalled){severity=5;status='Change study strategy';reason=`The two most recent comparable weekly cycles did not produce a higher reassessment score (${recent.map(x=>(x>0?'+':'')+Math.round(x)+' pts').join(', ')}).`;}
    return {skill,rows,score,repeated,stalled,below,unassessed,averageDelta,severity,status,reason};
  };

  const actionText=x=>{
    if(x.unassessed)return 'Take the baseline knowledge check first, then use the result to choose a targeted study activity.';
    if(x.stalled)return 'Do not simply repeat the same reading. Review incorrect-answer explanations, use the secondary resource from a different angle, record one practical reflection based on observable evidence, then reassess.';
    if(x.repeated&&x.below)return 'Use the primary guide to close the specific gap, add one non-confidential practical reflection, then complete a fresh reassessment.';
    if(x.below)return 'Review the targeted guide or tool and reassess after completing a focused study activity.';
    if(x.repeated)return 'The topic is recurring even though the latest score is acceptable; reinforce it with the secondary resource and practical reflection rather than chasing score alone.';
    return 'Continue normal progression and revisit this area when a future plan or assessment identifies a new gap.';
  };

  const render=()=>{
    const root=document.querySelector('[data-lms-development-attention]');
    if(!root)return;
    const history=read(HISTORY_KEY,[]),roleId=localStorage.getItem(ROLE_KEY)||'engineer',role=ROLES[roleId]||ROLES.engineer;
    const rows=SKILLS.map(s=>analyze(s,history,role.target)).sort((a,b)=>b.severity-a.severity||(a.score??-1)-(b.score??-1));
    const top=rows[0];
    const repeatedCount=rows.filter(x=>x.repeated).length,stalledCount=rows.filter(x=>x.stalled).length,belowCount=rows.filter(x=>x.below).length;
    const topLabel=top.severity?top.skill.name:'No immediate attention area';
    root.innerHTML=`
      <div class="dash-cards" style="margin-bottom:16px">
        <div class="dash-card"><small>Role study benchmark</small><strong>${role.target}%</strong></div>
        <div class="dash-card"><small>Repeated priority areas</small><strong>${repeatedCount}</strong></div>
        <div class="dash-card"><small>Below benchmark</small><strong>${belowCount}</strong></div>
        <div class="dash-card"><small>Strategy-change signals</small><strong>${stalledCount}</strong></div>
      </div>
      <div class="lms-item" style="margin-bottom:14px"><div class="lms-item-icon">FOCUS</div><div><h3>${esc(topLabel)}</h3><p><strong>${esc(top.status)}</strong> · ${esc(top.reason)}</p><p style="margin-top:6px">${esc(actionText(top))}</p></div>${top.severity?`<a class="btn btn-secondary" href="${esc(top.skill.study)}">Review priority</a>`:''}</div>
      <div class="lms-table-wrap"><table class="lms-table"><thead><tr><th>Learning area</th><th>Latest self-check</th><th>Weekly priority count</th><th>Average plan change</th><th>Attention signal</th><th>Next action</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${esc(x.skill.name)}</strong></td><td>${x.score===null?'Not assessed':x.score+'%'}</td><td>${x.rows.length}</td><td>${x.averageDelta===null?'—':`${x.averageDelta>0?'+':''}${Math.round(x.averageDelta)} pts`}</td><td>${esc(x.status)}</td><td><a href="${esc(x.stalled?x.skill.support:x.unassessed?x.skill.quiz:x.skill.study)}">${x.stalled?'Change resource':x.unassessed?'Take baseline':'Study next'}</a></td></tr>`).join('')}</tbody></table></div>
      <p class="lms-local-note">Attention signals use only browser-local self-assessment and archived study-plan history. A repeated or lower score means the study approach may need adjustment; it is not a diagnosis of competence, job performance, promotion readiness, certification status, or authorization to perform technical work.</p>`;
  };

  const loadScript=src=>{if(document.querySelector(`script[src="${src}"]`))return;const script=document.createElement('script');script.src=src;script.defer=true;document.body.appendChild(script);};
  const mountStrategyTracker=()=>{
    const attention=document.getElementById('development-attention');
    if(!attention)return;
    let tracker=document.getElementById('strategy-outcomes');
    if(!tracker){
      tracker=document.createElement('section');
      tracker.className='panel';
      tracker.id='strategy-outcomes';
      tracker.innerHTML='<h2>Study strategy outcome tracker</h2><p class="lms-local-note">When repeated study is not improving a self-check result, test a different learning method and compare the first fresh reassessment with the saved baseline.</p><div data-lms-strategy-outcomes></div>';
      attention.insertAdjacentElement('afterend',tracker);
    }
    let insights=document.getElementById('strategy-insights');
    if(!insights){
      insights=document.createElement('section');
      insights.className='panel';
      insights.id='strategy-insights';
      insights.innerHTML='<h2>Study strategy insights</h2><p class="lms-local-note">Compare repeated strategy experiments to see which learning approaches have produced better self-assessment movement for you on this browser.</p><div data-lms-strategy-insights></div>';
      tracker.insertAdjacentElement('afterend',insights);
    }
    const nav=document.querySelector('.side-nav');
    if(nav){
      if(!nav.querySelector('a[href="#strategy-outcomes"]')){const link=document.createElement('a');link.href='#strategy-outcomes';link.textContent='Strategy Outcomes';const attentionLink=nav.querySelector('a[href="#development-attention"]');if(attentionLink)attentionLink.insertAdjacentElement('afterend',link);else nav.appendChild(link);}
      if(!nav.querySelector('a[href="#strategy-insights"]')){const link=document.createElement('a');link.href='#strategy-insights';link.textContent='Strategy Insights';const trackerLink=nav.querySelector('a[href="#strategy-outcomes"]');if(trackerLink)trackerLink.insertAdjacentElement('afterend',link);else nav.appendChild(link);}
    }
    loadScript('/lms-strategy-outcomes.js');
    loadScript('/lms-strategy-insights.js');
  };

  const init=()=>{render();mountStrategyTracker();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('storage',render);
  document.addEventListener('submit',e=>{if(e.target.closest('form[data-lms-quiz]'))setTimeout(render,0)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-role-plan-refresh]'))setTimeout(render,0)});
})();
