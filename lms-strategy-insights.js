(()=>{
  const KEY='sea_lms_strategy_experiments_v1';
  const WEEKLY_KEY='sea_lms_role_weekly_history_v1';
  const ROLE_KEY='sea_lms_role_target_v1';
  const METHODS={secondary:'Different resource',reflection:'Errors + practical reflection',evidence:'Evidence-first review'};
  const ROLES={technician:65,engineer:75,lead:85};
  const SKILLS={
    hvac:{name:'HVAC Troubleshooting',quizKey:'sea_lms_quiz_v1'},
    rca:{name:'RCA & 5-Why',quizKey:'sea_lms_quiz_rca_v1'},
    ppm:{name:'Preventive Maintenance & PPM',quizKey:'sea_lms_quiz_ppm_v1'},
    electrical:{name:'Electrical Troubleshooting',quizKey:'sea_lms_quiz_electrical_v1'}
  };
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  const fmt=n=>`${n>0?'+':''}${Math.round(n*10)/10} pts`;
  const cls=n=>n>0?'lms-positive':n<0?'lms-negative':'lms-neutral';
  const completed=()=>{const x=read(KEY,{history:[]});return (Array.isArray(x?.history)?x.history:[]).filter(h=>h&&h.status==='Completed'&&Number.isFinite(Number(h.delta)));};
  const stats=(rows,keyFn)=>{
    const m=new Map();
    rows.forEach(r=>{const k=keyFn(r);if(!k)return;const a=m.get(k)||[];a.push(Number(r.delta)||0);m.set(k,a)});
    return [...m].map(([key,deltas])=>({key,count:deltas.length,avg:mean(deltas),positive:deltas.filter(x=>x>0).length,neutral:deltas.filter(x=>x===0).length,negative:deltas.filter(x=>x<0).length}));
  };
  const latestScore=skill=>{
    const q=read(skill.quizKey,{}),a=Array.isArray(q?.attempts)?q.attempts:[];
    const valid=a.filter(x=>Number(x?.total)>0).sort((x,y)=>new Date(x.at||x.completedAt||0)-new Date(y.at||y.completedAt||0));
    if(!valid.length)return null;
    const last=valid[valid.length-1];
    return Math.round((Number(last.score)||0)/(Number(last.total)||1)*100);
  };
  const repeatedPriorityCount=skill=>{
    const rows=read(WEEKLY_KEY,[]);if(!Array.isArray(rows))return 0;
    return rows.filter(x=>x&&x.skillName===skill.name).length;
  };
  const roleTarget=()=>ROLES[localStorage.getItem(ROLE_KEY)||'engineer']||ROLES.engineer;
  const experimentHref=(skillId,method)=>`/student-dashboard.html?strategySkill=${encodeURIComponent(skillId)}&strategyMethod=${encodeURIComponent(method)}#strategy-outcomes`;
  const render=()=>{
    const root=document.querySelector('[data-lms-strategy-insights]');if(!root)return;
    const rows=completed();
    if(!rows.length){root.innerHTML='<div class="lms-empty"><strong>No strategy evidence yet.</strong><span>Complete study-strategy experiments first. The LMS will only compare methods after real browser-local before/after results exist.</span></div><p class="lms-local-note">A single experiment is not treated as proof that a study method works. Recommendations require repeated local evidence.</p>';return;}
    const byMethod=stats(rows,r=>r.method).sort((a,b)=>b.avg-a.avg);
    const reliable=byMethod.filter(x=>x.count>=2);
    const best=reliable[0];
    const bySkill=Object.entries(SKILLS).map(([id,skill])=>{
      const sr=rows.filter(r=>r.skillId===id);
      const ms=stats(sr,r=>r.method).sort((a,b)=>b.avg-a.avg);
      const rb=ms.find(x=>x.count>=2);
      return {id,...skill,count:sr.length,best:rb,methods:ms,score:latestScore(skill),priorityCount:repeatedPriorityCount(skill)};
    }).filter(x=>x.count||x.score!==null||x.priorityCount);
    const summary=best?`<div class="lms-status"><strong>Most promising repeated method:</strong> ${esc(METHODS[best.key]||best.key)} · ${best.count} experiments · average change <span class="${cls(best.avg)}">${fmt(best.avg)}</span>. This is a personal learning signal, not a causal or scientific conclusion.</div>`:`<div class="lms-status"><strong>More evidence needed:</strong> ${rows.length} completed experiment${rows.length===1?'':'s'} exist, but no study method has been tested at least twice yet.</div>`;
    const target=roleTarget();
    const globalFallback=byMethod.find(x=>x.count>=3&&x.avg>0);
    const recommendations=bySkill.map(s=>{
      const isGap=(s.score!==null&&s.score<target)||s.priorityCount>=2;
      if(!isGap)return null;
      const local=s.best&&s.best.avg>0?s.best:null;
      const chosen=local||globalFallback;
      if(!chosen)return null;
      const evidence=local?`${chosen.count} experiments in this learning area`:`${chosen.count} experiments across assessed areas`;
      const confidence=local?(chosen.count>=3?'stronger local signal':'early repeated local signal'):'cross-topic signal only';
      return `<div class="lms-item"><div class="lms-item-icon">NEXT</div><div><h3>${esc(s.name)}</h3><p><strong>Suggested study method:</strong> ${esc(METHODS[chosen.key]||chosen.key)}</p><p style="margin-top:6px">Reason: ${s.score===null?'no current self-check score':`latest self-check ${s.score}% versus ${target}% study benchmark`}${s.priorityCount>=2?` · selected as a weekly priority ${s.priorityCount} times`:''}. Evidence: ${esc(evidence)} · average change <span class="${cls(chosen.avg)}">${fmt(chosen.avg)}</span> · ${esc(confidence)}.</p></div><div><a class="btn btn-secondary" href="${esc(experimentHref(s.id,chosen.key))}">Use this method</a></div></div>`;
    }).filter(Boolean);
    const recommendationHtml=recommendations.length?`<div style="margin-top:18px"><h3 style="font-size:14px">Evidence-gated next study method</h3><div class="lms-list">${recommendations.join('')}</div><p class="lms-local-note">Selecting “Use this method” opens the Strategy Outcome Tracker with the recommended learning area and study method already chosen. You still confirm before the experiment begins.</p></div>`:`<div class="lms-status" style="margin-top:14px"><strong>No automatic method suggestion yet.</strong> The LMS needs both a current development gap and sufficient repeated positive strategy evidence before recommending a study method.</div>`;
    const methodTable=`<div class="lms-table-wrap" style="margin-top:14px"><table class="lms-table"><thead><tr><th>Study method</th><th>Experiments</th><th>Avg. score change</th><th>Improved</th><th>No change</th><th>Lower</th><th>Evidence</th></tr></thead><tbody>${byMethod.map(x=>`<tr><td>${esc(METHODS[x.key]||x.key)}</td><td>${x.count}</td><td class="${cls(x.avg)}">${fmt(x.avg)}</td><td>${x.positive}</td><td>${x.neutral}</td><td>${x.negative}</td><td>${x.count>=3?'Stronger local signal':x.count===2?'Early repeated signal':'Insufficient sample'}</td></tr>`).join('')}</tbody></table></div>`;
    const skillRows=bySkill.filter(x=>x.count);
    const skillTable=skillRows.length?`<div style="margin-top:18px"><h3 style="font-size:14px">Method signals by learning area</h3><div class="lms-table-wrap"><table class="lms-table"><thead><tr><th>Learning area</th><th>Experiments</th><th>Best repeated method</th><th>Average change</th><th>Guidance</th></tr></thead><tbody>${skillRows.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.count}</td><td>${s.best?esc(METHODS[s.best.key]||s.best.key):'Not enough repeated evidence'}</td><td class="${s.best?cls(s.best.avg):'lms-neutral'}">${s.best?fmt(s.best.avg):'—'}</td><td>${s.best?(s.best.avg>0?'Consider this method first for the next study cycle, then keep measuring.':s.best.avg===0?'No measured advantage yet; vary the approach and reassess.':'This repeated method has not improved scores so far; try a different approach.'):'Repeat methods deliberately before comparing them.'}</td></tr>`).join('')}</tbody></table></div></div>`:'';
    root.innerHTML=summary+recommendationHtml+methodTable+skillTable+'<p class="lms-local-note">Study-strategy insights are calculated only from this browser’s saved before/after self-assessment experiments. Small samples can be misleading. They do not establish professional competence, training effectiveness for other people, certification, job readiness, or authorization to perform technical work.</p>';
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',render);
  document.addEventListener('submit',e=>{if(e.target.closest('form[data-lms-quiz]'))setTimeout(render,0)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-strategy-start],[data-strategy-cancel]'))setTimeout(render,0)});
})();
