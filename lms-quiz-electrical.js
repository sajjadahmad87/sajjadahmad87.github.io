(()=>{
  const QUIZ_KEY='sea_lms_quiz_electrical_v1';
  const LMS_KEY='sea_lms_state_v1';
  const ACCOUNT_KEY='sea_account_v2';
  const SESSION_KEY='sea_session_v2';
  const COURSE_ID='electrical-troubleshooting';
  const QUESTIONS=[
    {q:'Before investigating an electrical fault inside equipment, what is the safest starting principle?',a:['Open the panel and look for loose wires first','Follow approved isolation/LOTO and verify the required safe state before contact or intrusive testing','Reset protection repeatedly until the fault clears','Measure resistance on an energized circuit'],c:1,e:'The troubleshooting method must begin with the approved site electrical-safety process. Isolation, verification, PTW/LOTO and competent-person controls take priority over fault-finding speed.'},
    {q:'A three-phase motor shows one line current much lower than the other two. What is the strongest diagnostic response?',a:['Immediately increase overload setting','Confirm the measurement, then investigate supply phase condition, connections, contactor/power path and motor circuit using the approved safe test method','Assume the motor bearings are always the cause','Replace the VFD without checking evidence'],c:1,e:'Current imbalance is evidence, not a root cause. First verify the reading, then systematically inspect the supply and power path before replacing components.'},
    {q:'A motor protection device trips repeatedly after restart. What should happen next?',a:['Keep resetting until production continues','Bypass the protection temporarily','Stop repeated resets and investigate the trip indication, load, current, mechanical condition, supply and protection settings against approved/OEM requirements','Increase every protection setting'],c:2,e:'Repeated resetting can conceal or worsen a fault. Use trip information and measured evidence to identify whether the issue is electrical, mechanical, load-related or configuration-related.'},
    {q:'When comparing three-phase current readings, what makes the result most useful for troubleshooting?',a:['Measure only one phase because all phases should be identical','Record all phase readings under a known operating condition and compare them with equipment/load context and approved design or OEM data','Use an estimated current from memory','Ignore operating load'],c:1,e:'Comparable phase measurements under known conditions are much more useful than a single isolated value. Load, operating state and reference data matter.'},
    {q:'Which statement best describes a sound electrical troubleshooting sequence?',a:['Replace the most expensive component first','Start with the most likely fault and skip verification','Define the symptom, make the system safe, verify measurements, isolate the fault logically, correct the confirmed cause, then test and document the result','Change multiple components at once so the fault disappears faster'],c:2,e:'A controlled sequence preserves evidence and reduces unnecessary replacement: define, make safe, measure, isolate, correct, verify and document.'}
  ];
  const scoreAnswers=answers=>QUESTIONS.reduce((score,x,i)=>score+(answers[i]!==null&&answers[i]!==undefined&&Number(answers[i])===x.c?1:0),0);
  const resultMarkup=score=>{const pct=Math.round(score/QUESTIONS.length*100);return `<p><strong>Score: ${score}/${QUESTIONS.length} (${pct}%).</strong> ${pct>=80?'Strong result. Review any missed explanation and keep using safe, evidence-based troubleshooting discipline.':'Review the explanations, use the resources below, and retry when ready.'}</p><nav class="lms-quiz-actions" aria-label="Recommended electrical review resources"><span>Next study:</span><a class="btn btn-secondary" href="/tools/three-phase-power-calculator/">Three-phase power tool</a><a class="btn btn-secondary" href="/guides/vfd-fundamentals/">VFD fundamentals guide</a></nav>`};
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
    lms.activity.unshift({type:'quiz-attempt',courseId:COURSE_ID,label:`Electrical troubleshooting knowledge check: ${score}/${QUESTIONS.length}`,at});lms.activity=lms.activity.slice(0,40);lms.updatedAt=at;
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
  const renderSummary=()=>{const q=quizState(),b=bestScore();document.querySelectorAll('[data-lms-electrical-quiz-best]').forEach(el=>el.textContent=b===null?'Not attempted':`${b}/${QUESTIONS.length}`);document.querySelectorAll('[data-lms-electrical-quiz-attempts]').forEach(el=>el.textContent=String(q.attempts.length));};
  const mount=()=>{
    const root=document.querySelector('[data-lms-electrical-quiz]');if(!root)return;
    root.innerHTML=`<div class="lms-quiz-head"><div><span class="badge">KNOWLEDGE CHECK</span><h2>Industrial Electrical Troubleshooting Practical Check</h2><p>Five questions focused on safe isolation, three-phase evidence, protection trips and systematic fault isolation.</p></div><div class="lms-quiz-score"><small>Best score</small><strong data-lms-electrical-quiz-best>Not attempted</strong></div></div><form data-lms-electrical-quiz-form>${QUESTIONS.map((x,i)=>`<fieldset class="lms-quiz-question"><legend>${i+1}. ${x.q}</legend>${x.a.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"><span>${o}</span></label>`).join('')}<div class="lms-quiz-feedback" data-electrical-feedback="${i}" hidden></div></fieldset>`).join('')}<div class="lms-quiz-actions"><button class="btn btn-primary" type="submit">Submit electrical check</button><button class="btn btn-secondary" type="reset">Clear answers</button><span class="lms-local-note">Attempts on this browser: <strong data-lms-electrical-quiz-attempts>0</strong></span></div><div class="lms-quiz-result" data-lms-electrical-result hidden aria-live="polite" tabindex="-1"></div></form>`;
    renderSummary();
    const form=root.querySelector('[data-lms-electrical-quiz-form]');
    form.addEventListener('submit',e=>{
      e.preventDefault();if(!signedIn())return login();const fd=new FormData(form);let answered=0;const answers=[];
      QUESTIONS.forEach((x,i)=>{const raw=fd.get('q'+i),box=form.querySelector(`[data-electrical-feedback="${i}"]`);if(raw!==null){answered++;answers[i]=raw;const ok=Number(raw)===x.c;box.hidden=false;box.className='lms-quiz-feedback '+(ok?'ok':'needs-review');box.textContent=(ok?'Correct. ':'Review: ')+x.e}else{box.hidden=false;box.className='lms-quiz-feedback needs-review';box.textContent='Select an answer before submitting. '+x.e}});
      const score=scoreAnswers(answers);const result=form.querySelector('[data-lms-electrical-result]');if(answered<QUESTIONS.length){result.hidden=false;result.textContent=`You answered ${answered} of ${QUESTIONS.length} questions. Complete all questions to save an attempt.`;const firstUnanswered=QUESTIONS.findIndex((_,i)=>fd.get('q'+i)===null);const firstInput=firstUnanswered>=0?form.querySelector(`input[name="q${firstUnanswered}"]`):null;if(firstInput)firstInput.focus();return}
      if(!saveAttempt(score)){result.hidden=false;result.setAttribute('role','alert');result.setAttribute('aria-live','assertive');result.textContent='Your attempt could not be verified in browser storage, so no success was recorded. Check browser storage permissions, reload, and try again.';result.focus();return}renderSummary();result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.hidden=false;result.innerHTML=resultMarkup(score);result.focus();
    });
    form.addEventListener('reset',()=>setTimeout(()=>{form.querySelectorAll('.lms-quiz-feedback').forEach(x=>{x.hidden=true;x.textContent=''});const r=form.querySelector('[data-lms-electrical-result]');r.hidden=true;r.textContent=''},0));
  };
  document.addEventListener('DOMContentLoaded',()=>{mount();renderSummary()});
})();
