(()=>{
  const GOAL_KEY='sea_lms_weekly_goal_v1';
  const LMS_KEY='sea_lms_state_v1';
  const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const startOfWeek=()=>{const d=new Date();const day=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()-day);return d};
  const completedThisWeek=()=>{
    const state=read(LMS_KEY)||{};const start=startOfWeek().getTime();
    return (Array.isArray(state.activity)?state.activity:[]).filter(x=>x?.type==='module-complete'&&new Date(x.at).getTime()>=start).length;
  };
  const getGoal=()=>{const g=read(GOAL_KEY);const n=Number(g?.modules);return Number.isFinite(n)&&n>=1&&n<=14?Math.round(n):3};
  const announce=(m)=>{const live=document.querySelector('[data-lms-live]');if(live)live.textContent=m};
  const render=()=>{
    const root=document.querySelector('[data-lms-weekly-goal]');if(!root)return;
    const goal=getGoal(),done=completedThisWeek(),pct=Math.min(100,Math.round(done/goal*100));
    const remaining=Math.max(0,goal-done);
    root.innerHTML=`<div class="lms-goal-head"><div><strong>${done} of ${goal} modules</strong><small>${remaining?remaining+' remaining this week':'Weekly goal achieved'}</small></div><span>${pct}%</span></div><div class="lms-progress-bar"><span style="width:${pct}%"></span></div><form class="lms-goal-form" data-lms-goal-form><label for="weeklyGoal">Weekly module target</label><div><input id="weeklyGoal" name="goal" type="number" min="1" max="14" step="1" value="${goal}" aria-describedby="weeklyGoalHelp"><button class="btn btn-secondary" type="submit">Set goal</button></div><small id="weeklyGoalHelp">Choose 1–14 module milestones per week. Stored only on this browser.</small></form>`;
    const form=root.querySelector('[data-lms-goal-form]');
    form?.addEventListener('submit',e=>{
      e.preventDefault();const input=form.elements.goal;const n=Math.max(1,Math.min(14,Math.round(Number(input.value)||3)));
      write(GOAL_KEY,{modules:n,updatedAt:new Date().toISOString()});render();announce('Weekly learning goal set to '+n+' modules');
    });
  };
  document.addEventListener('DOMContentLoaded',render);
  window.addEventListener('storage',e=>{if(e.key===LMS_KEY||e.key===GOAL_KEY)render()});
  document.addEventListener('change',e=>{if(e.target?.matches?.('[data-lms-module]'))setTimeout(render,0)});
})();
