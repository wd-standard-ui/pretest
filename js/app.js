// app.js — App shell + routing + categorized exams + profile header
import { Auth } from './auth.js';
import * as API from './api.js';
import * as UI from './ui.js';
import * as Exam from './exam.js';

const views = {
  login: document.getElementById('view-login'),
  home: document.getElementById('view-home'),
  exam: document.getElementById('view-exam'),
  teacherShortcut: document.getElementById('view-teacher-shortcut')
};

function show(id){
  Object.values(views).forEach(v=>v.classList.add('hidden'));
  (views[id]||views.login).classList.remove('hidden');
}

function activeTab(tabId){
  document.querySelectorAll('.appbar .btn-tab').forEach(b=>b.classList.remove('font-bold','text-blue-600'));
  const el = document.getElementById(tabId);
  if (el) el.classList.add('font-bold','text-blue-600');
}

async function renderHome(){
  // Profile header
  const me = Auth.profile || {};
  const heroAvatar = document.getElementById('heroAvatar');
  const heroName = document.getElementById('heroName');
  const heroRole = document.getElementById('heroRole');
  if (me.picture_url) heroAvatar.src = me.picture_url;
  heroName.textContent = me.display_name || 'ผู้ใช้';
  heroRole.textContent = Auth.mode === 'guest' ? 'Guest Mode (นอก LINE)' : 'LINE User';

  // Subjects
  const subjRes = await API.apiGet('listClasses'); // we don't have subjects endpoint via GET; fallback render tabs from subjects stored by admin? 
  // Instead call JSONP to list subjects via GAS admin wrapper if available
  let subjects = [];
  try {
    const sres = await fetch(new URL(API.SCRIPT_URL || '', location).toString()); // noop
  } catch(_) {}

  // Render exams grouped by subject using listOpenExams
  const res = await API.apiGet('listOpenExams');
  const grid = document.getElementById('examGrid');
  grid.innerHTML='';
  if (!res.ok) {
    UI.toast(res.error,'error');
    return;
  }
  const list = res.data || [];
  const bySubject = {};
  list.forEach(ex => {
    (bySubject[ex.subject_id] = bySubject[ex.subject_id] || []).push(ex);
  });

  const tabs = document.getElementById('subjectTabs');
  tabs.innerHTML='';
  const keys = Object.keys(bySubject);
  const allBtn = document.createElement('button'); allBtn.className='tab active'; allBtn.textContent='ทั้งหมด'; allBtn.dataset.key='*';
  tabs.appendChild(allBtn);
  keys.forEach(k=>{
    const b = document.createElement('button');
    b.className='tab'; b.dataset.key = k; b.textContent = k.toUpperCase();
    tabs.appendChild(b);
  });

  function renderCards(filter='*'){
    grid.innerHTML='';
    list.filter(ex => filter==='*' || ex.subject_id===filter).forEach(ex => {
      const card = document.createElement('div');
      card.className = 'card space-y-2';
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">${ex.title}</div>
            <div class="text-xs text-gray-500">คะแนนผ่าน ${ex.passing_score} | เวลา ${ex.time_limit} นาที</div>
          </div>
          <span class="badge ${ex.subject_id==='math'?'bg-blue-100 text-blue-700':ex.subject_id==='eng'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}">${ex.subject_id}</span>
        </div>
        <button class="btn w-full">เริ่มทำข้อสอบ</button>`;
      card.querySelector('button').onclick = ()=>{
        location.hash = '#/exam/'+ex.id;
      };
      grid.appendChild(card);
    });
  }
  renderCards('*');
  tabs.querySelectorAll('.tab').forEach(b=>{
    b.onclick = ()=>{
      tabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderCards(b.dataset.key);
    };
  });

  // Teacher shortcut
  const role = (Auth.profile && Auth.profile.role) || 'student';
  const shortcut = document.getElementById('view-teacher-shortcut');
  const linkAdmin = document.getElementById('linkAdmin');
  if (role==='teacher' || role==='admin'){
    shortcut.classList.remove('hidden');
    // Assume SCRIPT_URL in config.js
    import('./config.js').then(cfg=>{
      linkAdmin.href = cfg.SCRIPT_URL + '?action=ui';
    }).catch(()=>{});
  }else{
    shortcut.classList.add('hidden');
  }
}

async function boot(){
  // header handlers are in auth.js
  try{
    await Auth.init();
    // mount exam hash router
    window.addEventListener('hashchange', ()=>{
      const m = location.hash.match(/#\/exam\/(.+)$/);
      if (m){ show('exam'); Exam.openExam(m[1]); activeTab('tabExams'); }
      else { show('home'); activeTab('tabHome'); }
    });
    // initial route
    if (location.hash.startsWith('#/exam/')){
      show('exam'); const id = location.hash.split('/').pop(); Exam.openExam(id);
      activeTab('tabExams');
    } else {
      show('home'); await renderHome(); activeTab('tabHome');
    }
  }catch(err){
    console.warn(err);
    show('login');
    UI.toast('กรุณาเข้าสู่ระบบด้วย LINE หรือใช้โหมดทดสอบ','info');
    document.getElementById('btnLineLogin').onclick = ()=>Auth.login();
  }
}

window.addEventListener('DOMContentLoaded', boot);
