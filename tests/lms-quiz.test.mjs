import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const quizzes = [
  {
    file: 'lms-quiz.js',
    label: 'HVAC',
    links: ['/guides/ahu-troubleshooting/', '/guides/vfd-fundamentals/']
  },
  {
    file: 'lms-quiz-rca.js',
    label: 'RCA',
    links: ['/guides/root-cause-analysis-5-why/', '/guides/fmea-maintenance/']
  },
  {
    file: 'lms-quiz-ppm.js',
    label: 'PPM',
    links: ['/guides/ppm-checklist/', '/guides/preventive-maintenance/']
  },
  {
    file: 'lms-quiz-electrical.js',
    label: 'electrical',
    links: ['/tools/three-phase-power-calculator/', '/guides/vfd-fundamentals/']
  }
];

const loadQuiz = async (file, storage = {}) => {
  const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
  const instrumented = source.replace(
    /\n\}\)\(\);\s*$/,
    '\n;globalThis.__SEA_QUIZ_TEST__={QUESTIONS,scoreAnswers,resultMarkup,signedIn,...(typeof saveAttempt===\"function\"?{saveAttempt}: {})};\n})();\n'
  );
  const storageApi = typeof storage.getItem === 'function' ? storage : {
    getItem(key) { return Object.hasOwn(storage, key) ? storage[key] : null; },
    setItem(key, value) { storage[key] = String(value); },
    removeItem(key) { delete storage[key]; }
  };
  const context = {
    console,
    Number,
    Math,
    Date,
    document: { addEventListener() {} },
    localStorage: storageApi,
    location: { pathname: '/quiz.html', search: '', hash: '', href: '' },
    encodeURIComponent
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(instrumented, context);
  return context.__SEA_QUIZ_TEST__;
};

for (const quiz of quizzes) {
  test(quiz.label + ' scoring uses the production answer keys', async () => {
    const { QUESTIONS, scoreAnswers } = await loadQuiz(quiz.file);
    const correct = QUESTIONS.map(question => question.c);
    const oneWrong = [...correct];
    oneWrong[0] = (correct[0] + 1) % QUESTIONS[0].a.length;

    assert.equal(scoreAnswers(correct), QUESTIONS.length);
    assert.equal(scoreAnswers(oneWrong), QUESTIONS.length - 1);
    assert.equal(scoreAnswers(QUESTIONS.map(() => null)), 0);
  });

  test(quiz.label + ' attempt ownership check requires a matching learner session', async () => {
    const account = JSON.stringify({ email: 'learner@example.com' });
    const matching = JSON.stringify({ email: 'learner@example.com' });
    const different = JSON.stringify({ email: 'different@example.com' });

    assert.equal((await loadQuiz(quiz.file)).signedIn(), false);
    assert.equal((await loadQuiz(quiz.file, {
      sea_account_v2: account,
      sea_session_v2: matching
    })).signedIn(), true);
    assert.equal((await loadQuiz(quiz.file, {
      sea_account_v2: account,
      sea_session_v2: different
    })).signedIn(), false);
  });

  test(quiz.label + ' result renders accurate score and review links', async () => {
    const { QUESTIONS, resultMarkup } = await loadQuiz(quiz.file);
    const strong = resultMarkup(QUESTIONS.length);
    const review = resultMarkup(2);

    assert.ok(strong.includes('Score: ' + QUESTIONS.length + '/' + QUESTIONS.length + ' (100%).'));
    assert.match(review, /Score: 2\/5 \(40%\)\./);
    assert.match(review, /aria-label="Recommended [^"]+ review resources"/);
    for (const href of quiz.links) {
      assert.ok(review.includes('href="' + href + '"'), 'Missing review link: ' + href);
    }
  });
}

test('PPM missed answers link to accessible, focused guide sections', async () => {
  const source = await readFile(new URL('../lms-quiz-ppm.js', import.meta.url), 'utf8');
  const guide = await readFile(new URL('../guides/ppm-checklist/index.html', import.meta.url), 'utf8');
  const { QUESTIONS } = await loadQuiz('lms-quiz-ppm.js');

  assert.equal(QUESTIONS.length, 5);
  for (const question of QUESTIONS) {
    assert.match(question.r, /^\/guides\/ppm-checklist\/#[-a-z]+$/);
    const fragment = question.r.split('#')[1];
    assert.ok(guide.includes('id="' + fragment + '"'), 'Missing guide target: ' + fragment);
  }
  assert.match(source, /aria-describedby="ppm-feedback-\$\{i\}"/);
  assert.match(source, /link\.textContent='Review this topic'/);
  assert.match(source, /box\.textContent='Select an answer before submitting\.'/);
});

test('PPM attempt transaction verifies both records and rolls back partial writes', async () => {
  const quizKey = 'sea_lms_quiz_ppm_v1';
  const lmsKey = 'sea_lms_state_v1';
  const initialQuiz = JSON.stringify({ attempts: [{ score: 3, total: 5, at: 'before' }] });
  const initialLms = JSON.stringify({ activity: [{ label: 'before' }], enrolled: {}, saved: [], progress: {} });
  const values = new Map([[quizKey, initialQuiz], [lmsKey, initialLms]]);
  let failKey = lmsKey;
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      values.set(key, String(value));
      if (key === failKey) { failKey = null; throw new Error('simulated quota failure'); }
    },
    removeItem(key) { values.delete(key); }
  };
  const { saveAttempt } = await loadQuiz('lms-quiz-ppm.js', storage);

  assert.equal(saveAttempt(4), false);
  assert.equal(values.get(quizKey), initialQuiz);
  assert.equal(values.get(lmsKey), initialLms);

  assert.equal(saveAttempt(4), true);
  const quiz = JSON.parse(values.get(quizKey));
  const lms = JSON.parse(values.get(lmsKey));
  assert.equal(quiz.attempts[0].score, 4);
  assert.equal(quiz.attempts.length, 2);
  assert.equal(lms.activity[0].label, 'PPM knowledge check: 4/5');
  assert.equal(lms.activity.length, 2);
  assert.equal(quiz.attempts[0].at, lms.activity[0].at);
});

test('PPM storage errors use focused assertive feedback before success rendering', async () => {
  const source = await readFile(new URL('../lms-quiz-ppm.js', import.meta.url), 'utf8');
  assert.match(source, /result\.setAttribute\('role','alert'\)/);
  assert.match(source, /result\.setAttribute\('aria-live','assertive'\)/);
  assert.match(source, /no success was recorded/);
  assert.match(source, /if\(!saveAttempt\(score\)\)/);
});

const transactionalQuizzes = [
  { file: 'lms-quiz.js', quizKey: 'sea_lms_quiz_v1', label: 'HVAC knowledge check' },
  { file: 'lms-quiz-rca.js', quizKey: 'sea_lms_quiz_rca_v1', label: 'RCA knowledge check' },
  { file: 'lms-quiz-electrical.js', quizKey: 'sea_lms_quiz_electrical_v1', label: 'Electrical troubleshooting knowledge check' }
];

for (const quiz of transactionalQuizzes) {
  test(quiz.label + ' rolls back both records after a partial storage failure', async () => {
    const lmsKey = 'sea_lms_state_v1';
    const initialQuiz = JSON.stringify({ attempts: [{ score: 2, total: 5, at: 'before' }] });
    const initialLms = JSON.stringify({ activity: [{ label: 'before' }], enrolled: {}, saved: [], progress: {} });
    const values = new Map([[quiz.quizKey, initialQuiz], [lmsKey, initialLms]]);
    let failKey = lmsKey;
    const storage = {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) {
        values.set(key, String(value));
        if (key === failKey) { failKey = null; throw new Error('simulated quota failure'); }
      },
      removeItem(key) { values.delete(key); }
    };
    const { saveAttempt } = await loadQuiz(quiz.file, storage);

    assert.equal(saveAttempt(4), false);
    assert.equal(values.get(quiz.quizKey), initialQuiz);
    assert.equal(values.get(lmsKey), initialLms);

    assert.equal(saveAttempt(4), true);
    const storedQuiz = JSON.parse(values.get(quiz.quizKey));
    const storedLms = JSON.parse(values.get(lmsKey));
    assert.equal(storedQuiz.attempts[0].score, 4);
    assert.equal(storedQuiz.attempts.length, 2);
    assert.equal(storedLms.activity[0].label, quiz.label + ': 4/5');
    assert.equal(storedLms.activity.length, 2);
    assert.equal(storedQuiz.attempts[0].at, storedLms.activity[0].at);
  });

  test(quiz.label + ' exposes focused assertive storage-error feedback', async () => {
    const source = await readFile(new URL('../' + quiz.file, import.meta.url), 'utf8');
    assert.match(source, /result\.setAttribute\('role','alert'\)/);
    assert.match(source, /result\.setAttribute\('aria-live','assertive'\)/);
    assert.match(source, /if\(!saveAttempt\(score\)\)/);
    assert.match(source, /no success was recorded/);
  });
}
