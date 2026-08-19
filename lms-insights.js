(()=>{
  const LMS_KEY='sea_lms_state_v1';
  const readState=()=>{try{return JSON.parse(localStorage.getItem(LMS_KEY)||'null')||{activity:[]}}catch{return {activity:[]}}};
  const localDay=(value)=>{
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return null;
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const dayKey=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const startOfDay=(offset=0)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+offset);return d};
  const formatShort=(d)=>new Intl.DateTimeFormat('en',{weekday:'short'}).format(d);
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const calculate=()=>{
    const state=readState();
    const activity=Array.isArray(state.activity)?state.activity.filter(x=>x&&x.at):[];
    const activeDays=new Set(activity.map(x=>localDay(x.at)).filter(Boolean));
    const today=startOfDay(0),yesterday=startOfDay(-1);
    let cursor=activeDays.has(dayKey(today))?today:(activeDays.has(dayKey(yesterday))?yesterday:null);
    let streak=0;
    while(cursor&&activeDays.has(dayKey(cursor))){streak++;const prev=new Date(cursor);prev.setDate(prev.getDate()-1);cursor=prev}

    const sevenStart=startOfDay(-6);
    const recent=activity.filter(x=>new Date(x.at)>=sevenStart);
    const moduleCompletions=recent.filter(x=>x.type==='module-complete').length;
    const activeLast7=new Set(recent.map(x=>localDay(x.at)).filter(Boolean)).size;
    const enrolled=recent.filter(x=>x.type==='enrolled').length;

    const days=[];
    for(let i=-6;i<=0;i++){
      const d=startOfDay(i),key=dayKey(d),count=activity.filter(x=>localDay(x.at)===key).length;
      days.push({label:formatShort(d),key,count,active:count>0,isToday:i===0});
    }
    return {streak,activeLast7,moduleCompletions,enrolled,days};
  };

  const render=()=>{
    const root=document.querySelector('[data-lms-insights]');
    if(!root)return;
    const x=calculate();
    root.innerHTML=`
      <div class="lms-insight-stats">
        <div class="lms-insight-stat"><strong>${x.streak}</strong><span>day current streak</span></div>
        <div class="lms-insight-stat"><strong>${x.activeLast7}</strong><span>active days / 7</span></div>
        <div class="lms-insight-stat"><strong>${x.moduleCompletions}</strong><span>modules completed</span></div>
        <div class="lms-insight-stat"><strong>${x.enrolled}</strong><span>new enrolments</span></div>
      </div>
      <div class="lms-week-strip" aria-label="Learning activity over the last seven days">
        ${x.days.map(d=>`<div class="lms-week-day${d.active?' is-active':''}${d.isToday?' is-today':''}" title="${esc(d.key)}: ${d.count} learning action${d.count===1?'':'s'}"><span>${esc(d.label)}</span><i aria-hidden="true"></i><small>${d.count}</small></div>`).join('')}
      </div>
      <p class="lms-local-note">A learning day is counted when this browser records an enrolment, saved-learning action, course open, or module-progress action. Streaks are local to this device and are not yet synchronized across devices.</p>`;
  };

  document.addEventListener('DOMContentLoaded',()=>{
    render();
    document.addEventListener('click',e=>{if(e.target.closest('[data-lms-reset]'))setTimeout(render,80)});
  });
})();
