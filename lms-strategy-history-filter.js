(()=>{
  const FILTER_KEY='sea_lms_strategy_history_filter_v1';
  const valid=new Set(['all','verified','manual','fully-verified']);
  const readFilter=()=>{try{const v=localStorage.getItem(FILTER_KEY)||'all';return valid.has(v)?v:'all'}catch{return'all'}};
  const saveFilter=v=>{try{localStorage.setItem(FILTER_KEY,v)}catch{}};
  const parseTasks=text=>{
    const m=String(text||'').match(/(\d+)\s*\/\s*(\d+)(?:\s*\((\d+)\s+verified\))?/i);
    return m?{completed:Number(m[1]),total:Number(m[2]),verified:Number(m[3]||0)}:{completed:0,total:0,verified:0};
  };
  const matches=(stats,filter)=>{
    if(filter==='verified')return stats.verified>0;
    if(filter==='manual')return stats.completed>stats.verified;
    if(filter==='fully-verified')return stats.completed>0&&stats.completed===stats.verified;
    return true;
  };
  const apply=(root,filter)=>{
    const rows=[...root.querySelectorAll('tbody tr')];
    let shown=0;
    rows.forEach(row=>{
      const stats=parseTasks(row.children[2]?.textContent);
      const show=matches(stats,filter);
      row.hidden=!show;
      if(show)shown++;
    });
    root.querySelectorAll('[data-strategy-history-filter]').forEach(btn=>{
      const active=btn.dataset.strategyHistoryFilter===filter;
      btn.setAttribute('aria-pressed',String(active));
      btn.classList.toggle('btn-primary',active);
      btn.classList.toggle('btn-secondary',!active);
    });
    const summary=root.querySelector('[data-strategy-history-summary]');
    if(summary)summary.textContent=`${shown} of ${rows.length} completed experiment${rows.length===1?'':'s'} shown`;
  };
  const enhance=container=>{
    if(!container||container.dataset.strategyFilterEnhanced==='1')return;
    const table=container.querySelector('table.lms-table');
    if(!table)return;
    container.dataset.strategyFilterEnhanced='1';
    const controls=document.createElement('div');
    controls.style.margin='10px 0 12px';
    controls.innerHTML=`<div class="lms-toolbar" role="group" aria-label="Filter study strategy history by task verification"><button type="button" class="btn btn-secondary" data-strategy-history-filter="all" aria-pressed="false">All</button><button type="button" class="btn btn-secondary" data-strategy-history-filter="verified" aria-pressed="false">Has verified action</button><button type="button" class="btn btn-secondary" data-strategy-history-filter="fully-verified" aria-pressed="false">Fully verified tasks</button><button type="button" class="btn btn-secondary" data-strategy-history-filter="manual" aria-pressed="false">Includes manual check</button></div><p class="lms-local-note" style="margin:8px 0 0"><strong>Verification legend:</strong> Verified action = this browser recorded the linked learning action. Manual check = the learner marked the task complete. Neither is independent verification of workplace performance. <span data-strategy-history-summary></span></p>`;
    table.parentElement?.insertAdjacentElement('beforebegin',controls);
    apply(container,readFilter());
  };
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-strategy-history-filter]');
    if(!btn)return;
    const filter=btn.dataset.strategyHistoryFilter;
    if(!valid.has(filter))return;
    saveFilter(filter);
    const container=btn.closest('[data-lms-strategy-outcomes]');
    if(container)apply(container,filter);
  });
  const scan=()=>document.querySelectorAll('[data-lms-strategy-outcomes]').forEach(enhance);
  document.addEventListener('DOMContentLoaded',scan);
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('storage',e=>{if(e.key===FILTER_KEY)scan()});
})();
