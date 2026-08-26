import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourcePath = new URL('../lms-strategy-outcomes.js', import.meta.url);

test('strategy outcomes render malformed stored scores as unavailable text', async () => {
  const state = {
    active: null,
    history: [{
      skillId: 'hvac', method: 'secondary', status: 'Completed',
      baselineScore: '<img src=x onerror=alert(1)>',
      afterScore: '</td><script>alert(2)</script>', delta: '<svg onload=alert(3)>'
    }]
  };
  const root = {
    innerHTML: '',
    addEventListener() {},
    querySelector() { return null; }
  };
  const context = {
    console,
    URLSearchParams,
    localStorage: {
      getItem(key) { return key === 'sea_lms_strategy_experiments_v1' ? JSON.stringify(state) : null; },
      setItem() {}
    },
    location: { search: '', pathname: '/student-dashboard.html', hash: '' },
    history: { replaceState() {} },
    document: {
      readyState: 'complete',
      querySelector(selector) { return selector === '[data-lms-strategy-outcomes]' ? root : null; },
      getElementById() { return null; },
      addEventListener() {}
    },
    window: { addEventListener() {} },
    setTimeout(callback) { callback(); return 1; }
  };
  vm.createContext(context);
  vm.runInContext(await readFile(sourcePath, 'utf8'), context, { filename: 'lms-strategy-outcomes.js' });

  assert.doesNotMatch(root.innerHTML, /<img|<script|<svg|onerror|onload/i);
  assert.match(root.innerHTML, /<td>—<\/td><td>—<\/td>/);
});
