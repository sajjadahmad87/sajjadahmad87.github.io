(()=>{
  const QUIZ_KEY='sea_lms_quiz_rca_v1';
  const LMS_KEY='sea_lms_state_v1';
  const COURSE_ID='root-cause-analysis';
  const QUESTIONS=[
    {q:'Which problem statement gives the strongest starting point for an RCA?',a:['Machine breakdown happened again','Motor overload trip occurred at 14:20 during normal production after current rose above the overload setting','Technician failed to maintain the machine','Bearing problem'],c:1,e:'A useful problem statement is specific about what happened, where/when it happened, operating context and observable consequence without assigning an unverified cause.'},
    {q:'In a 5-Why analysis, what should support each answer to “why”?',a:['The most experienced person’s opinion','A fixed requirement to ask exactly five questions','Evidence such as measurements, alarms, inspections, trends or maintenance history','A likely spare-part failure'],c:2,e:'Each step should be supported by evidence. The method may require fewer or more than five questions depending on the investigation.'},
    {q:'Why is “operator error” usually a weak final root cause?',a:['Operators never make mistakes','It often stops the investigation before identifying the process, design, instruction, training or control conditions that allowed the error','Human factors must never be considered','It cannot be written in an RCA report'],c:1,e:'Human actions may be contributing factors, but a strong RCA asks what system conditions made the error possible or likely.'},
    {q:'Which corrective action is most measurable?',a:['Monitor the machine closely','Tell the team to be careful','Replace parts as required','Add monthly vibration readings at DE/NDE bearings, define an alarm criterion, assign an owner and review the trend for three months'],c:3,e:'A strong action has a defined task, owner, timing and verification method rather than vague monitoring language.'},
    {q:'When should an RCA be considered effectively closed?',a:['As soon as the report is signed','Immediately after the failed part is replaced','After actions are implemented and later verification shows the intended reliability or risk improvement','When five whys have been written'],c:2,e:'Closure should include verification that corrective/preventive actions actually changed the outcome. Recurrence should trigger review of the original assumptions.'}
  ];
  const scoreAnswers=answers=>QUESTIONS.reduce((score,x,i)=>score+(answers[i]!==null&&answers[i]!==undefined&&Number(answers[i])===x.c?1:0),0);
  const resultMarkup=score=>{const pct=Math.round(score/QUESTIONS.length*100);return `<p><strong>Score: ${score}/${QUESTIONS.length} (${pct}%).</strong> ${pct>=80?'Strong result. Review any missed explanation before moving on.':'Review the explanations, use the resources below, and retry when ready.'}</p><nav class="lms-quiz-actions" aria-label="Recommended RCA review resources"><span>Next study:</span><a class="btn btn-secondary" href="/guides/root-cause-analysis-5-why/">RCA and 5-Why guide</a><a class="btn btn-secondary" href="/guides/fmea-maintenance/">Maintenance FMEA guide</a></nav>`};
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const quizState=()=>{const x=read(QUIZ_KEY)||{attempts:[]};x.attempts=Array.isArray(x.attempts)?x.attempts:[];return x};
  const bestScore=()=>{const a=quizState().attempts;return a.length?Math.max(...a.map(x=>Number(x.score)||0)):null};
  const addActivity=score=>{const s=read(LMS_KEY)||{enrolled:{},saved:[],progress:{},activity:[]};s.activity=Array.isArray(s.activity)?s.activity:[];s.activity.unshift({type:'quiz-attempt',courseId:COURSE_ID,label:`RCA knowledge check: ${score}/${QUESTIONS.length}`,at:new Date().toISOString()});s.activity=s.activity.slice(0,40);s.updatedAt=new Date().toISOString();write(LMS_KEY,s)};
  const renderSummary=()=>{
    const q=quizState(),b=bestScore();
    document.querySelectorAll('[data-lms-rca-quiz-best]').forEach(el=>el.textContent=b===null?'Not attempted':`${b}/${QUESTIONS.length}`);
    document.querySelectorAll('[data-lms-rca-quiz-attempts]').forEach(el=>el.textContent=String(q.attempts.length));
  };
  const mount=()=>{
    const root=document.querySelector('[data-lms-rca-quiz]');if(!root)return;
    root.innerHTML=`<div class="lms-quiz-head"><div><span class="badge">KNOWLEDGE CHECK</span><h2>RCA & 5-Why Practical Check</h2><p>Five questions focused on evidence quality, problem definition, CAPA and validation.</p></div><div class="lms-quiz-score"><small>Best score</small><strong data-lms-rca-quiz-best>Not attempted</strong></div></div><form data-lms-rca-quiz-form>${QUESTIONS.map((x,i)=>`<fieldset class="lms-quiz-question"><legend>${i+1}. ${x.q}</legend>${x.a.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"><span>${o}</span></label>`).join('')}<div class="lms-quiz-feedback" data-rca-feedback="${i}" hidden></div></fieldset>`).join('')}<div class="lms-quiz-actions"><button class="btn btn-primary" type="submit">Submit RCA check</button><button class="btn btn-secondary" type="reset">Clear answers</button><span class="lms-local-note">Attempts on this browser: <strong data-lms-rca-quiz-attempts>0</strong></span></div><div class="lms-quiz-result" data-lms-rca-result hidden aria-live="polite" tabindex="-1"></div></form>`;
    renderSummary();
    const form=root.querySelector('[data-lms-rca-quiz-form]');
    form.addEventListener('submit',e=>{
      e.preventDefault();const fd=new FormData(form);let answered=0;const answers=[];
      QUESTIONS.forEach((x,i)=>{const raw=fd.get('q'+i),box=form.querySelector(`[data-rca-feedback="${i}"]`);if(raw!==null){answered++;answers[i]=raw;const ok=Number(raw)===x.c;box.hidden=false;box.className='lms-quiz-feedback '+(ok?'ok':'needs-review');box.textContent=(ok?'Correct. ':'Review: ')+x.e}else{box.hidden=false;box.className='lms-quiz-feedback needs-review';box.textContent='Select an answer before submitting. '+x.e}});
      const score=scoreAnswers(answers);const result=form.querySelector('[data-lms-rca-result]');if(answered<QUESTIONS.length){result.hidden=false;result.textContent=`You answered ${answered} of ${QUESTIONS.length} questions. Complete all questions to save an attempt.`;const firstUnanswered=QUESTIONS.findIndex((_,i)=>fd.get('q'+i)===null);const firstInput=firstUnanswered>=0?form.querySelector(`input[name="q${firstUnanswered}"]`):null;if(firstInput)firstInput.focus();return}
      const state=quizState();state.attempts.unshift({courseId:COURSE_ID,score,total:QUESTIONS.length,at:new Date().toISOString()});state.attempts=state.attempts.slice(0,20);write(QUIZ_KEY,state);addActivity(score);renderSummary();result.hidden=false;result.innerHTML=resultMarkup(score);result.focus();
    });
    form.addEventListener('reset',()=>setTimeout(()=>{form.querySelectorAll('.lms-quiz-feedback').forEach(x=>{x.hidden=true;x.textContent=''});const r=form.querySelector('[data-lms-rca-result]');r.hidden=true;r.textContent=''},0));
  };
  document.addEventListener('DOMContentLoaded',()=>{mount();renderSummary()});
})();
