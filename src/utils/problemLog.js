/* global __APP_VERSION__ */
// v1.10.83 - the Problem log. Every storage access is wrapped: this code runs
// while something else is already failing, and must never add a second error
// (private windows and "block site data" make localStorage throw).
import { makeEntry, pushEntry, buildIssueUrl } from './errorReport.js';

const KEY = 'fgsb_problem_log';
const EVENT = 'fgsb-problem-logged';
// Injected by vite.config.js from package.json, so a report names the version
// of the bundle that actually failed, even when the server cannot be reached.
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'unknown';

// Kept in memory too, so the log still works when storage is blocked.
let memory = [];

export function getProblems() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(v)) memory = v.filter((e) => e && typeof e === 'object' && typeof e.message === 'string');
  } catch { /* storage blocked or damaged: use the in-memory copy */ }
  return memory;
}

function save(list) {
  memory = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage full or blocked */ }
  try { window.dispatchEvent(new CustomEvent(EVENT)); } catch { /* ignore */ }
}

export function clearProblems() { save([]); }

export function onProblemsChanged(fn) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

const currentView = () => {
  try { return sessionStorage.getItem('gst_currentView') || 'dashboard'; } catch { return ''; }
};

// v1.10.83 - "no answer" (the server stopped, restarting or updating) is one
// problem whichever request hit it: a screen loads ten things at once, and
// the log filled with ten entries saying the same thing.
const sig = (e) => (e.kind === 'api' && !e.api?.status
  ? 'api|no-answer'
  : `${e.kind}|${e.message}|${e.api?.path || ''}|${e.api?.status || ''}`);

// Returns the stored entry (or null). A repeat of the last problem within 30s
// is not stored or sent again: a screen retrying every second would otherwise
// fill the log and the server's errors.log with one problem.
export function logProblem({ kind, message, stack, api } = {}) {
  try {
    const entry = makeEntry({ kind, message, stack, api, view: currentView(), version: APP_VERSION, ua: navigator.userAgent });
    const list = getProblems();
    const last = list[list.length - 1];
    if (last && sig(last) === sig(entry) && Date.parse(entry.time) - Date.parse(last.time) < 30_000) return last;
    save(pushEntry(list, entry));
    // Plain fetch, not apiFetch: a failing report must never log itself.
    fetch('/api/client-errors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry), keepalive: true,
    }).catch(() => { /* server down: the browser copy is enough */ });
    return entry;
  } catch {
    return null;
  }
}

export function lastProblemWithin(ms) {
  const list = getProblems();
  const last = list[list.length - 1];
  return last && Date.now() - Date.parse(last.time) <= ms ? last : null;
}

// Clipboard API is blocked on plain http in some browsers and inside some
// frames: fall back to a hidden textarea + execCommand.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

export function openReport(entry) {
  try { window.open(buildIssueUrl(entry), '_blank', 'noopener,noreferrer'); } catch { /* popup blocked */ }
}
