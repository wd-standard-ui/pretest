// api.js — CORS-safe (no Authorization header)
import { SCRIPT_URL } from './config.js';
import { Auth } from './auth.js';

export { SCRIPT_URL }; // re-export for convenience

function makeUrl(action, params = {}){
  const url = new URL(SCRIPT_URL);
  url.searchParams.set('action', action);
  if (Auth?.token) url.searchParams.set('token', Auth.token);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k, v));
  return url.toString();
}

export async function apiGet(action, params={}){
  const res = await fetch(makeUrl(action, params), { method:'GET' });
  return res.json();
}

export async function apiPost(action, body={}){
  const form = new URLSearchParams();
  if (Auth?.token) form.set('token', Auth.token);
  Object.entries(body).forEach(([k,v])=>form.set(k, typeof v==='object'? JSON.stringify(v) : String(v)));
  const res = await fetch(makeUrl(action), {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' },
    body: form.toString()
  });
  return res.json();
}
