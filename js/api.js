// api.js — helper เรียก Apps Script
import { SCRIPT_URL } from './config.js';
import { Auth } from './auth.js';

function headers(){
  const h = { 'Content-Type': 'application/json' };
  if (Auth.token) h['Authorization'] = 'Bearer '+Auth.token;
  return h;
}

export async function apiGet(action, params={}){
  const url = new URL(SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
  const res = await fetch(url.toString(), { headers: headers() });
  return res.json();
}

export async function apiPost(action, body={}){
  const url = SCRIPT_URL + '?action=' + encodeURIComponent(action);
  const res = await fetch(url, { method:'POST', headers: headers(), body: JSON.stringify(body) });
  return res.json();
}
