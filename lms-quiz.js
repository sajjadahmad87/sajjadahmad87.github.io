(()=>{
  const QUIZ_KEY='sea_lms_quiz_v1';
  const LMS_KEY='sea_lms_state_v1';
  const ACCOUNT_KEY='sea_account_v2';
  const SESSION_KEY='sea_session_v2';
  const COURSE_ID='industrial-hvac-troubleshooting';
  const QUESTIONS=[
    {q:'An AHU shows low airflow. Which first step best follows an evidence-based troubleshooting sequence?',a:['Immediately increase fan speed','Check filters, dampers, fan/VFD status and measured airflow evidence','Replace the control valve','Reset all alarms and continue operation'],c:1,e:'Start with observable airside restrictions and operating evidence before changing setpoints or replacing components.'},
    {q:'A temperature sensor reading appears abnormal. What is the strongest next action?',a:['Assume the sensor is correct','Replace the sensor immediately','Cross-check it with a calibrated reference and verify location/wiring before concluding','Change the controller setpoint'],c:2,e:'Verification with an independent reference helps separate a real process condition from a sensor, wiring or installation issue.'},
    {q:'What is the main purpose of a 5-Why / RCA exercise after a repeated HVAC fault?',a:['Assign blame','Identify the evidence-supported underlying cause and corrective controls','Create a longer maintenance report','Avoid collecting measurements'],c:1,e:'RCA should connect evidence to the underlying cause and to actions that prevent recurrence.'},
    {q:'When checking a fan driven by a VFD, which statement is most appropriate?',a:['Drive output frequency alone proves airflow is correct','Electrical isolation and OEM/site procedures still take priority before intrusive checks','The VFD can always be bypassed for testing','Motor current should always equal nameplate current'],c:1,e:'VFD systems contain hazardous electrical energy. Approved isolation, LOTO/PTW and OEM/site procedures remain mandatory.'},
    {q:'Which conclusion is safest when water-side temperature performance is poor?',a:['A single temperature reading proves the root cause','Replace the pump immediately','Validate flow, valve position, sensor accuracy, load and operating conditions before assigning cause','Disable controls to stabilize the system'],c:2,e:'Water-side performance depends on several interacting variables, so the diagnosis should be based on validated measurements and operating context.'}
  ];
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const signedIn=()=>{const a=read(ACCOUNT_KEY),s=read(SESSION_KEY);return !!(a&&s&&a.email&&a.email===s.email)};
  const login=()=>{location.href='/signin.html?return='+encodeURIComponent(location.pathname+location.search+location.hash)};
  const quizState=()=>{const x=read(QUIZ_KEY)||{attempts:[]};x.attempts=Array.isArray(x.attempts)?x.attempts:[];return x};
  const addActivity=(score)=>{const s=read(LMS_KEY)||{enrolled:{},saved:[],progress:{},activity:[]};s.activity=Array.isArray(s.activity)?s.activity:[];s.activity.unshift({type:'quiz-attempt',courseId:COURSE_ID,label:`HVAC knowledge check: ${score}/${QUESTIONS.length}`,at:new Date().toISOString()});s.activity=s.activity.slice(0,40);s.updatedAt=new Date().toISOString();write(LMS_KEY,s)};
  const bestScore=()=>{const a=quizState().attempts;return a.length?Math.max(...a.map(x=>Number(x.score)||0)):null};
  const renderSummary=()=>{
    document.querySelectorAll('[data-lms-quiz-best]').forEach(el=>{const b=bestScore();el.textContent=b===null?'Not attempted':`${b}/${QUESTIONS.length}`});
    document.querySelectorAll('[data-lms-quiz-attempts]').forEach(el=>el.textContent=String(quizState().attempts.length));
  };
  const mount=()=>{
    const root=document.querySelector('[data-lms-quiz]');if(!root)return;
    root.innerHTML=`<div class="lms-quiz-head"><div><span class="badge">KNOWLEDGE CHECK</span><h2>HVAC Troubleshooting Knowledge Check</h2><p>Five practical questions on airside diagnostics, sensors, VFD safety, water-side evidence and RCA. Results are stored only on this browser.</p></div><div class="lms-quiz-score"><small>Best score</small><strong data-lms-quiz-best>Not attempted</strong></div></div><form data-lms-quiz-form>${QUESTIONS.map((x,i)=>`<fieldset class="lms-quiz-question"><legend>${i+1}. ${x.q}</legend>${x.a.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"><span>${o}</span></label>`).join('')}<div class="lms-quiz-feedback" data-feedback="${i}" hidden></div></fieldset>`).join('')}<div class="lms-quiz-actions"><button class="btn btn-primary" type="submit">Submit knowledge check</button><button class="btn btn-secondary" type="reset">Clear answers</button><span class="lms-local-note">Attempts on this browser: <strong data-lms-quiz-attempts>0</strong></span></div><div class="lms-quiz-result" data-lms-quiz-result hidden aria-live="polite" tabindex="-1"></div></form>`;
    renderSummary();
    const form=root.querySelector('[data-lms-quiz-form]');
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!signedIn())return login();
      const fd=new FormData(form);let score=0,answered=0;
      QUESTIONS.forEach((x,i)=>{
        const raw=fd.get('q'+i),box=form.querySelector(`[data-feedback="${i}"]`);if(raw!==null){answered++;const n=Number(raw),ok=n===x.c;if(ok)score++;box.hidden=false;box.className='lms-quiz-feedback '+(ok?'ok':'needs-review');box.textContent=(ok?'Correct. ':'Review: ')+x.e}else{box.hidden=false;box.className='lms-quiz-feedback needs-review';box.textContent='Select an answer before submitting. '+x.e}
      });
      const result=form.querySelector('[data-lms-quiz-result]');
      if(answered<QUESTIONS.length){result.hidden=false;result.textContent=`You answered ${answered} of ${QUESTIONS.length} questions. Complete all questions to save an attempt.`;const firstUnanswered=QUESTIONS.findIndex((_,i)=>fd.get('q'+i)===null);const firstInput=firstUnanswered>=0?form.querySelector(`input[name="q${firstUnanswered}"]`):null;if(firstInput)firstInput.focus();return}
      const state=quizState();state.attempts.unshift({courseId:COURSE_ID,score,total:QUESTIONS.length,at:new Date().toISOString()});state.attempts=state.attempts.slice(0,20);write(QUIZ_KEY,state);addActivity(score);renderSummary();
      const pct=Math.round(score/QUESTIONS.length*100);result.hidden=false;result.innerHTML=`<p><strong>Score: ${score}/${QUESTIONS.length} (${pct}%).</strong> ${pct>=80?'Strong result. Review any missed explanations before continuing.':'Review the explanations, use the resources below, and try again when ready.'}</p><nav class="lms-quiz-actions" aria-label="Recommended HVAC review resources"><span>Next study:</span><a class="btn btn-secondary" href="/guides/ahu-troubleshooting/">AHU troubleshooting guide</a><a class="btn btn-secondary" href="/guides/vfd-fundamentals/">VFD fundamentals guide</a></nav>`;result.focus();
    });
    form.addEventListener('reset',()=>setTimeout(()=>{form.querySelectorAll('.lms-quiz-feedback').forEach(x=>{x.hidden=true;x.textContent=''});const r=form.querySelector('[data-lms-quiz-result]');r.hidden=true;r.textContent=''},0));
  };
  const loadCompletion=()=>{
    if(document.querySelector('script[data-lms-completion-loader]'))return;
    const s=document.createElement('script');s.src='/lms-completion.js';s.defer=true;s.setAttribute('data-lms-completion-loader','');document.head.appendChild(s);
  };
  document.addEventListener('DOMContentLoaded',()=>{mount();renderSummary();loadCompletion()});
})();
