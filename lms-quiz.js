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
  const scoreAnswers=answers=>QUESTIONS.reduce((score,x,i)=>score+(answers[i]!==null&&answers[i]!==undefined&&Number(answers[i])===x.c?1:0),0);
  const resultMarkup=score=>{const pct=Math.round(score/QUESTIONS.length*100);return `<p><strong>Score: ${score}/${QUESTIONS.length} (${pct}%).</strong> ${pct>=80?'Strong result. Review any missed explanations before continuing.':'Review the explanations, use the resources below, and try again when ready.'}</p><nav class="lms-quiz-actions" aria-label="Recommended HVAC review resources"><span>Next study:</span><a class="btn btn-secondary" href="/guides/ahu-troubleshooting/">AHU troubleshooting guide</a><a class="btn btn-secondary" href="/guides/vfd-fundamentals/">VFD fundamentals guide</a></nav>`};
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const restore=(key,before)=>{try{if(before===null)localStorage.removeItem(key);else localStorage.setItem(key,before);return localStorage.getItem(key)===before}catch{return false}};
  const saveAttempt=score=>{
    let beforeQuiz,beforeLms;try{beforeQuiz=localStorage.getItem(QUIZ_KEY);beforeLms=localStorage.getItem(LMS_KEY)}catch{return false}
    let quiz,lms;try{quiz=beforeQuiz?JSON.parse(beforeQuiz):{};lms=beforeLms?JSON.parse(beforeLms):{}}catch{return false}
    if(!quiz||typeof quiz!=='object'||Array.isArray(quiz)||!lms||typeof lms!=='object'||Array.isArray(lms))return false;
    quiz.attempts=Array.isArray(quiz.attempts)?quiz.attempts:[];
    lms.enrolled=lms.enrolled&&typeof lms.enrolled==='object'&&!Array.isArray(lms.enrolled)?lms.enrolled:{};
    lms.saved=Array.isArray(lms.saved)?lms.saved:[];
    lms.progress=lms.progress&&typeof lms.progress==='object'&&!Array.isArray(lms.progress)?lms.progress:{};
    lms.activity=Array.isArray(lms.activity)?lms.activity:[];
    const at=new Date().toISOString();
    quiz.attempts.unshift({courseId:COURSE_ID,score,total:QUESTIONS.length,at});quiz.attempts=quiz.attempts.slice(0,20);
    lms.activity.unshift({type:'quiz-attempt',courseId:COURSE_ID,label:`HVAC knowledge check: ${score}/${QUESTIONS.length}`,at});lms.activity=lms.activity.slice(0,40);lms.updatedAt=at;
    const quizRaw=JSON.stringify(quiz),lmsRaw=JSON.stringify(lms);
    try{
      localStorage.setItem(QUIZ_KEY,quizRaw);if(localStorage.getItem(QUIZ_KEY)!==quizRaw)throw new Error('Unverified quiz write');
      localStorage.setItem(LMS_KEY,lmsRaw);if(localStorage.getItem(LMS_KEY)!==lmsRaw)throw new Error('Unverified activity write');
      return true;
    }catch{restore(QUIZ_KEY,beforeQuiz);restore(LMS_KEY,beforeLms);return false}
  };
  const signedIn=()=>{const a=read(ACCOUNT_KEY),s=read(SESSION_KEY);return !!(a&&s&&a.email&&a.email===s.email)};
  const login=()=>{location.href='/signin.html?return='+encodeURIComponent(location.pathname+location.search+location.hash)};
  const quizState=()=>{const x=read(QUIZ_KEY)||{attempts:[]};x.attempts=Array.isArray(x.attempts)?x.attempts:[];return x};
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
      const fd=new FormData(form);let answered=0;const answers=[];
      QUESTIONS.forEach((x,i)=>{
        const raw=fd.get('q'+i),box=form.querySelector(`[data-feedback="${i}"]`);if(raw!==null){answered++;answers[i]=raw;const n=Number(raw),ok=n===x.c;box.hidden=false;box.className='lms-quiz-feedback '+(ok?'ok':'needs-review');box.textContent=(ok?'Correct. ':'Review: ')+x.e}else{box.hidden=false;box.className='lms-quiz-feedback needs-review';box.textContent='Select an answer before submitting. '+x.e}
      });
      const score=scoreAnswers(answers);const result=form.querySelector('[data-lms-quiz-result]');
      if(answered<QUESTIONS.length){result.hidden=false;result.textContent=`You answered ${answered} of ${QUESTIONS.length} questions. Complete all questions to save an attempt.`;const firstUnanswered=QUESTIONS.findIndex((_,i)=>fd.get('q'+i)===null);const firstInput=firstUnanswered>=0?form.querySelector(`input[name="q${firstUnanswered}"]`):null;if(firstInput)firstInput.focus();return}
      if(!saveAttempt(score)){result.hidden=false;result.setAttribute('role','alert');result.setAttribute('aria-live','assertive');result.textContent='Your attempt could not be verified in browser storage, so no success was recorded. Check browser storage permissions, reload, and try again.';result.focus();return}renderSummary();result.setAttribute('role','status');result.setAttribute('aria-live','polite');
      result.hidden=false;result.innerHTML=resultMarkup(score);result.focus();
    });
    form.addEventListener('reset',()=>setTimeout(()=>{form.querySelectorAll('.lms-quiz-feedback').forEach(x=>{x.hidden=true;x.textContent=''});const r=form.querySelector('[data-lms-quiz-result]');r.hidden=true;r.textContent=''},0));
  };
  const loadCompletion=()=>{
    if(document.querySelector('script[data-lms-completion-loader]'))return;
    const s=document.createElement('script');s.src='/lms-completion.js';s.defer=true;s.setAttribute('data-lms-completion-loader','');document.head.appendChild(s);
  };
  document.addEventListener('DOMContentLoaded',()=>{mount();renderSummary();loadCompletion()});
})();
