// api.js — CORS-safe simple requests (no Authorization header) + optional JSONP
import { SCRIPT_URL } from './config.js';
import { Auth } from './auth.js';

function makeUrl(action, params = {}) {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set('action', action);
  if (Auth?.token) url.searchParams.set('token', Auth.token); // token via query (optional)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// GET: no custom headers (avoid preflight)
export async function apiGet(action, params = {}) {
  const res = await fetch(makeUrl(action, params), { method: 'GET' });
  return res.json();
}

// POST: urlencoded (avoid preflight)
export async function apiPost(action, body = {}) {
  const form = new URLSearchParams();
  if (Auth?.token) form.set('token', Auth.token); // redundant but okay
  Object.entries(body).forEach(([k, v]) => {
    form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  });
  const res = await fetch(makeUrl(action), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: form.toString()
  });
  return res.json();
}

// Optional: JSONP fallback (rarely needed now)
export function apiGetJsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    params.callback = cb;
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    window[cb] = (data) => { resolve(data); cleanup(); };
    const s = document.createElement('script');
    s.src = url.toString();
    s.onerror = (e) => { reject(e); cleanup(); };
    document.head.appendChild(s);
    function cleanup(){ try{ delete window[cb]; }catch(_){} s.remove(); }
  });
}
