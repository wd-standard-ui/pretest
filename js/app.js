// app.js — Home & cards (appwd-like), guest preview behavior
import { Auth } from './auth.js';
import { apiGet, SCRIPT_URL } from './api.js';
import { toast, el } from './ui.js';
import * as Exam from './exam.js';

function activeTab(id){
  document.querySelectorAll('.tabbar .tab-btn').forEach(t=>t.classList.remove('font-bold','text-brand'));
  const el = document.getElementById(id); if (el) el.classList.add('font-bold','text-brand');
}

async function renderHome(){
  const res = await apiGet('listOpenExams');
  const grid = document.getElementById('examGrid');
  const tabs = document.getElementById('subjectTabs');
  grid.innerHTML = ''; tabs.innerHTML = '';
  if (!res.ok){ toast(res.error,'error'); return; }
  let list = res.data || [];
  const isGuest = (Auth.mode === 'guest' || !Auth.isLoggedIn);
  if (isGuest) list = list.slice(0, Math.min(6, list.length)); // show more but still preview

  const bySubj = {};
  list.forEach(ex => { (bySubj[ex.subject_id]=bySubj[ex.subject_id]||[]).push(ex); });

  // Tabs
  const all = el('button','px-3 py-2 rounded-full bg-gray-100 text-sm'); all.textContent='ทั้งหมด'; all.dataset.key='*'; tabs.appendChild(all);
  Object.keys(bySubj).forEach(k=>{
    const b = el('button','px-3 py-2 rounded-full bg-gray-100 text-sm'); b.dataset.key=k; b.textContent=k.toUpperCase();
    tabs.appendChild(b);
  });
  tabs.firstChild.classList.add('bg-brand','text-white');

  function renderCards(key='*'){
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    list.filter(x=> key==='*' || x.subject_id===key).forEach(ex=>{
      const c = el('div','card space-y-2');
      c.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">${ex.title}</div>
            <div class="text-xs text-gray-500">ผ่าน ${ex.passing_score} | ${ex.time_limit} นาที</div>
          </div>
          <span class="badge ${ex.subject_id==='math'?'bg-blue-100 text-blue-700':ex.subject_id==='eng'?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}">${ex.subject_id}</span>
        </div>
        <button class="btn w-full">${isGuest?'ดูตัวอย่าง':'เริ่มทำข้อสอบ'}</button>`;
      const btn = c.querySelector('button');
      if (isGuest){
        btn.onclick = ()=> Swal.fire({
          title: 'เข้าสู่ระบบด้วย LINE',
          text: 'เพื่อเริ่มทำข้อสอบจริง โปรดเข้าสู่ระบบ',
          icon: 'info', confirmButtonText: 'Login with LINE', showCancelButton: true, cancelButtonText: 'ภายหลัง'
        }).then(r=>{ if (r.isConfirmed) Auth.login(); });
      }else{
        btn.onclick = ()=>{ location.hash = '#/exam/'+ex.id; };
      }
      frag.appendChild(c);
    });
    grid.appendChild(frag);
  }
  renderCards('*');
  tabs.querySelectorAll('button').forEach(b=> b.onclick = ()=>{
    tabs.querySelectorAll('button').forEach(x=>x.classList.remove('bg-brand','text-white'));
    b.classList.add('bg-brand','text-white');
    renderCards(b.dataset.key);
  });

  // Teacher shortcut link
  const t = document.getElementById('teacherShortcut');
  const link = document.getElementById('linkAdmin');
  if ((Auth.profile && (Auth.profile.role==='teacher' || Auth.profile.role==='admin')) || false){
    t.classList.remove('hidden');
    link.href = SCRIPT_URL + '?action=ui';
  } else {
    t.classList.add('hidden');
  }
}

async function boot(){
  await Auth.init();
  // initial route
  if (location.hash.startsWith('#/exam/')){
    document.getElementById('view-home').classList.add('hidden');
    document.getElementById('view-exam').classList.remove('hidden');
    const id = location.hash.split('/').pop();
    await Exam.openExam(id);
    activeTab('tabExams');
  } else {
    document.getElementById('view-home').classList.remove('hidden');
    document.getElementById('view-exam').classList.add('hidden');
    await renderHome();
    activeTab('tabHome');
  }

  window.addEventListener('hashchange', async ()=>{
    if (location.hash.startsWith('#/exam/')){
      document.getElementById('view-home').classList.add('hidden');
      document.getElementById('view-exam').classList.remove('hidden');
      await Exam.openExam(location.hash.split('/').pop());
      activeTab('tabExams');
    } else {
      document.getElementById('view-exam').classList.add('hidden');
      document.getElementById('view-home').classList.remove('hidden');
      await renderHome();
      activeTab('tabHome');
    }
  });
}

window.addEventListener('DOMContentLoaded', boot);
