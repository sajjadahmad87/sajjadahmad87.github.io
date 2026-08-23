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
    '\n;globalThis.__SEA_QUIZ_TEST__={QUESTIONS,scoreAnswers,resultMarkup,signedIn};\n})();\n'
  );
  const context = {
    console,
    Number,
    Math,
    document: { addEventListener() {} },
    localStorage: { getItem(key) { return Object.hasOwn(storage, key) ? storage[key] : null; } },
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
