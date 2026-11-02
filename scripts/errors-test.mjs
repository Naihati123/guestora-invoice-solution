// v1.10.83 - Problem log and "Report this problem".
//
// Run: `node scripts/errors-test.mjs`
//
// A report becomes a PUBLIC GitHub issue, so the redaction is the part that
// must never regress: no GSTIN, PAN, phone, email, UPI id, IFSC or account
// number may survive. Also: the pre-filled issue URL stays under the length
// browsers and GitHub accept, known problems map to the right fix, and the
// log keeps only the newest 50 entries.

import {
  redact, shortStack, summarizeUA, systemOption, matchKnownProblem, knownProblemFor, makeEntry,
  pushEntry, formatDetails, buildIssueUrl, isChunkLoadError, KNOWN_PROBLEMS, MAX_ISSUE_URL,
} from '../src/utils/errorReport.js';

let passed = 0, failed = 0;
function ok(cond, label, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}${detail ? `\n     ${detail}` : ''}`); }
}
const eq = (a, b, label) => ok(a === b, label, `expected: ${JSON.stringify(b)}\n     actual:   ${JSON.stringify(a)}`);

const WIN_FF = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0';
const MAC_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const LINUX_EDGE = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0';

console.log('\n[Redaction] private details are removed');
const secret = 'Client 27AAPFU0939F1ZV (PAN AAPFU0939F) phone +91 98765 43210 / 9876543210, mail ramesh.k@gmail.com, '
  + 'UPI ramesh@okaxis, IFSC HDFC0001234, a/c 50100234567890, path C:\\Users\\Ramesh\\FreeGST\\data and /home/dicecodes/app';
const r = redact(secret);
for (const leak of ['27AAPFU0939F1ZV', 'AAPFU0939F', '98765', '43210', '9876543210', 'ramesh.k@gmail.com', 'ramesh@okaxis', 'HDFC0001234', '50100234567890', 'Ramesh', 'dicecodes']) {
  ok(!r.includes(leak), `"${leak}" is gone`, r);
}
for (const tag of ['[gstin]', '[pan]', '[phone]', '[email]', '[upi-id]', '[ifsc]', '[number]', '[user]']) ok(r.includes(tag), `marked ${tag}`, r);
eq(redact('27aapfu0939f1zv'), '[gstin]', 'lower-case GSTIN too');
eq(redact('Cannot read properties of undefined (reading \'map\')'), 'Cannot read properties of undefined (reading \'map\')', 'an ordinary error message is untouched');
eq(redact('POST /api/bills -> 500 at port 47371, line 12:345'), 'POST /api/bills -> 500 at port 47371, line 12:345', 'statuses, ports and line numbers survive');
eq(redact(null), '', 'null is an empty string, not a crash');
eq(redact('render@http://localhost:47371/assets/index-C1YUQ.js:9:58939'), 'render@http://localhost:47371/assets/index-C1YUQ.js:9:58939', 'a Firefox stack frame (fn@http://...) is not taken for a UPI id');
eq(redact('at x (index-C1.js:9:158939)'), 'at x (index-C1.js:9:158939)', 'a long column number in a stack frame survives');
eq(redact('a/c 1234567 and 9:158939'), 'a/c [number] and 9:[number]', 'other long numbers do not');

console.log('\n[Entry] built redacted, without request bodies');
const e = makeEntry({
  kind: 'api', message: 'Save failed for 27AAPFU0939F1ZV', stack: Array.from({ length: 20 }, (_, i) => `at f${i} (app.js:${i}:1)`).join('\n'),
  view: 'new', version: '1.10.83', ua: WIN_FF, api: { method: 'post', path: '/api/clients?name=DiceCodes%20Stationers&phone=9876543210', status: 500 },
});
ok(!JSON.stringify(e).includes('27AAPFU0939F1ZV'), 'GSTIN in the message is redacted');
ok(!JSON.stringify(e).includes('DiceCodes') && !JSON.stringify(e).includes('9876543210'), 'query string dropped from the path');
eq(e.api.path, '/api/clients', 'path only');
eq(e.api.method, 'POST', 'method upper-cased');
eq(e.stack.split('\n').length, 8, 'stack cut to 8 lines');
eq(e.browser, 'Firefox 140 on Windows', 'browser summary');
eq(makeEntry({}).message, '(no message)', 'empty input still gives an entry');
eq(shortStack('a\n\n  b  \nc', 2), 'a\nb', 'shortStack skips blank lines and trims');

console.log('\n[Browser] summary and the bug form\'s Computer option');
eq(summarizeUA(MAC_CHROME), 'Chrome 130 on Mac', 'Chrome on Mac');
eq(summarizeUA(LINUX_EDGE), 'Edge 130 on Linux', 'Edge (not Chrome) on Linux');
eq(summarizeUA(ANDROID), 'Chrome 130 on Android', 'Android');
eq(systemOption(WIN_FF), '', 'Windows 10 and 11 look the same: left for the user to pick');
eq(systemOption(MAC_CHROME), 'Mac', 'Mac');
eq(systemOption(LINUX_EDGE), 'Linux', 'Linux');
eq(systemOption(ANDROID), 'Phone or tablet (browser)', 'phone before Linux (Android says Linux too)');

console.log('\n[Known problems] message -> Troubleshooting section');
const cases = [
  ['Failed to fetch', 'cannot-connect'],
  ['NetworkError when attempting to fetch resource.', 'cannot-connect'],
  ['Load failed', 'cannot-connect'],
  ['Failed to fetch dynamically imported module: http://localhost/assets/Reports-x.js', 'app-out-of-date'],
  ['error loading dynamically imported module', 'app-out-of-date'],
  ['Request body too large', 'payload-too-large'],
  ['ENOSPC: no space left on device, write', 'disk-full'],
  ['The disk is full: free some space and try again', 'disk-full'],
  ["EPERM: operation not permitted, rename 'data/meta.json.tmp'", 'no-permission'],
  ['The app is not allowed to write to its data folder', 'no-permission'],
  ['[2026-10-29T10:00:00.000Z] [data] Skipped damaged file data/bills/INV_0007.json (not valid JSON) - restore it from a backup', 'damaged-file'],
  ['listen EADDRINUSE: address already in use 127.0.0.1:47371', 'port-in-use'],
  ['The Node.js on this PC (v6.10.1) is too old', 'old-node'],
  ['npm ERR! code ENOTDIR', 'old-node'],
  ['Wrong PIN', 'pin-forgotten'],
];
for (const [msg, id] of cases) eq(matchKnownProblem(msg)?.id, id, `"${msg.slice(0, 50)}" -> ${id}`);
eq(matchKnownProblem("Cannot read properties of undefined (reading 'map')"), null, 'an unknown error gets no fix link (just Report)');
eq(knownProblemFor({ message: 'API error: 413', api: { status: 413 } })?.id, 'payload-too-large', 'a 413 status counts even with a generic message');
ok(matchKnownProblem('Failed to fetch').url.endsWith('troubleshooting.html#cannot-connect'), 'fix link points at the docs anchor');
ok(KNOWN_PROBLEMS.every((k) => /^[a-z0-9-]+$/.test(k.id) && k.fix.length > 10), 'every known problem has an anchor id and a one-line fix');
ok(isChunkLoadError('Loading chunk 7 failed') && !isChunkLoadError('Failed to fetch'), 'chunk-load errors are told apart from a stopped server');

console.log('\n[Report URL] pre-filled GitHub form');
const url = buildIssueUrl(e);
const q = new URL(url).searchParams;
ok(url.startsWith('https://github.com/IamRamgarhia/Free-GST-Billing-Software/issues/new?'), 'opens a new issue');
eq(q.get('template'), 'bug_report.yml', 'uses the bug form');
eq(q.get('version'), '1.10.83', 'version field filled');
ok(q.get('title').startsWith('[Problem] Save failed for [gstin]'), 'title from the redacted message', q.get('title'));
ok(q.get('what').startsWith('```\n') && q.get('what').includes('Request: POST /api/clients -> 500'), 'what: details in a code block, with the request');
ok(q.get('what').includes('Steps: (please add what you did before this)'), 'what: asks for the steps');
ok(!q.has('system'), 'Computer left empty on Windows');
eq(new URL(buildIssueUrl(makeEntry({ message: 'x', ua: MAC_CHROME }))).searchParams.get('system'), 'Mac', 'Computer filled on a Mac');
ok(!/27AAPFU0939F1ZV|9876543210|DiceCodes/.test(decodeURIComponent(url)), 'nothing private in the URL');
ok(url.length <= MAX_ISSUE_URL, `normal report fits (${url.length} chars)`);
const huge = { ...e, message: 'é&?#'.repeat(3000), stack: Array.from({ length: 8 }, () => 'x'.repeat(1500)).join('\n') };
const hugeUrl = buildIssueUrl(huge);
ok(hugeUrl.length <= MAX_ISSUE_URL, `a huge message and stack are trimmed to fit (${hugeUrl.length} chars)`);
ok(new URL(hugeUrl).searchParams.get('what').includes('Steps:'), 'trimmed report still asks for the steps');
const longStack = { ...e, stack: Array.from({ length: 8 }, (_, i) => `at line${i} ${'y'.repeat(600)}`).join('\n') };
const lsUrl = buildIssueUrl(longStack);
ok(lsUrl.length <= MAX_ISSUE_URL && decodeURIComponent(lsUrl).includes('at line0'), 'a long stack is shortened from the bottom, keeping where it broke');
ok(formatDetails(e).includes('Screen: new') && formatDetails(e).includes('App version: 1.10.83'), 'details name the screen and version');

console.log('\n[Ring buffer] newest 50 kept');
let list = [];
for (let i = 0; i < 60; i += 1) list = pushEntry(list, { message: `m${i}` });
eq(list.length, 50, 'never more than 50');
eq(list[0].message, 'm10', 'oldest dropped first');
eq(list[49].message, 'm59', 'newest last');
const before = [{ message: 'a' }];
pushEntry(before, { message: 'b' });
eq(before.length, 1, 'does not change the list it was given');
eq(pushEntry('damaged', { message: 'c' }).length, 1, 'a damaged stored value starts a fresh list');

// v1.10.83 - a server restart: a screen's ten requests all get "no answer".
// That is one problem in the log, not ten. Real errors stay separate.
{
  const store = {};
  const mem = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  Object.assign(globalThis, { localStorage: mem, sessionStorage: mem, window: { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} }, CustomEvent: class { constructor(t) { this.type = t; } }, fetch: () => Promise.resolve() });
  if (!globalThis.navigator) Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'test' }, configurable: true });
  const { logProblem, getProblems, clearProblems } = await import('../src/utils/problemLog.js');
  clearProblems();
  for (const path of ['/api/profile', '/api/profiles', '/api/trash', '/api/lock']) {
    logProblem({ kind: 'api', message: 'Failed to fetch', api: { method: 'GET', path, status: 0 } });
  }
  eq(getProblems().length, 1, 'a burst of "no answer" requests is one entry');
  logProblem({ kind: 'api', message: 'Server error', api: { method: 'GET', path: '/api/profile', status: 500 } });
  eq(getProblems().length, 2, 'a real server error is still its own entry');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
