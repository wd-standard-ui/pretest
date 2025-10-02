import { apiGet, apiPost } from './api.js';
import { toast, el } from './ui.js';
import { SCRIPT_URL } from './config.js';

const viewExam = document.getElementById('view-exam');
const examTitle = document.getElementById('examTitle');
const examMeta = document.getElementById('examMeta');
const examTimer = document.getElementById('examTimer');
const examQuestions = document.getElementById('examQuestions');
const btnSubmit = document.getElementById('btnSubmitExam');
const btnPrint = document.getElementById('btnPrintExam');

// Mobile controls
const mobileControls = document.getElementById('mobileControls');
const btnPrevQ = document.getElementById('btnPrevQ');
const btnNextQ = document.getElementById('btnNextQ');
const qProgress = document.getElementById('qProgress');

let CURRENT = { id: null, secs: 0, tick: null, answers: {}, questions: [], idx: 0 };

export async function openExam(examId){
  const res = await apiGet('getExam', { id: examId });
  if (!res.ok) return toast(res.error,'error');
  const { exam, questions } = res.data;

  CURRENT.id = exam.id;
  CURRENT.secs = (Number(exam.time_limit)||10) * 60;
  CURRENT.answers = {};
  CURRENT.questions = questions || [];
  CURRENT.idx = 0;

  examTitle.textContent = exam.title;
  examMeta.textContent = `เวลาทำ ${exam.time_limit} นาที | คะแนนผ่าน ${exam.passing_score}`;

  renderQuestions(questions);
  startTimer();

  btnSubmit.onclick = submitExam;
  btnPrint.onclick = () => {
    const url = `${SCRIPT_URL}?action=printExam&id=${encodeURIComponent(exam.id)}`;
    window.open(url, '_blank');
  };

  setupMobilePager();
  updateMobilePager();
}

function setupMobilePager(){
  // Show controls only on small screens
  if (window.matchMedia('(max-width: 639px)').matches){
    mobileControls.classList.remove('hidden');
    btnPrevQ.onclick = ()=>{ if (CURRENT.idx>0){ CURRENT.idx--; updateMobilePager(); } };
    btnNextQ.onclick = ()=>{ if (CURRENT.idx<CURRENT.questions.length-1){ CURRENT.idx++; updateMobilePager(); } else { submitExam(); } };
  } else {
    mobileControls.classList.add('hidden');
  }
}

function updateMobilePager(){
  const total = CURRENT.questions.length || 0;
  qProgress.textContent = `ข้อ ${Math.min(CURRENT.idx+1,total)}/${total||'—'}`;
  // Hide all items except current
  const items = examQuestions.querySelectorAll('[data-qwrap]');
  items.forEach((it, i)=>{
    if (window.matchMedia('(max-width: 639px)').matches){
      it.classList.toggle('hidden', i !== CURRENT.idx);
    }else{
      it.classList.remove('hidden');
    }
  });
  // Auto-scroll to question on mobile
  if (window.matchMedia('(max-width: 639px)').matches){
    const cur = items[CURRENT.idx];
    if (cur) cur.scrollIntoView({ behavior:'smooth', block:'start' });
  }
}

function renderQuestions(questions){
  examQuestions.innerHTML = '';
  const frag = document.createDocumentFragment();
  questions.forEach((q, idx)=>{
    const box = el('div','card space-y-2');
    box.setAttribute('data-qwrap','');
    const imgs = (q.assets||[]).map(a=>`<img loading="lazy" src="${a.thumb||a.webViewLink}" alt="${a.name}" class="rounded-lg max-h-48 object-contain">`).join('');
    box.innerHTML = `
      <div class="font-semibold">ข้อ ${idx+1}. ${q.question_text}</div>
      ${imgs?`<div class="grid grid-cols-2 gap-2">${imgs}</div>`:''}
      <div data-q="${q.id}">${renderInput(q)}</div>`;
    frag.appendChild(box);
  });
  examQuestions.appendChild(frag);
  // After render, ensure pager state applies
  updateMobilePager();
}

function renderInput(q){
  if (q.question_type==='mcq'){
    const choices = (q.question_data && q.question_data.choices) || ['A','B','C','D'];
    return choices.map((label,i)=>`
      <label class="flex items-center gap-2">
        <input type="radio" name="q_${q.id}" value="${String.fromCharCode(65+i)}">
        <span>${label}</span>
      </label>`).join('');
  }else if(q.question_type==='tf'){
    return `
      <div class="flex gap-3" data-tf>
        <button class="px-3 py-2 rounded-xl border" onclick="this.closest('[data-tf]').dataset.value='T'">ถูก</button>
        <button class="px-3 py-2 rounded-xl border" onclick="this.closest('[data-tf]').dataset.value='F'">ผิด</button>
      </div>`;
  }else if(q.question_type==='fill'){
    return `<input class="border rounded-lg px-3 py-2 w-full" placeholder="พิมพ์คำตอบ">`;
  }else if(q.question_type==='matching'){
    return `<div class="text-sm text-gray-500">ใช้ dropdown/drag & drop (สาธิต minimal)</div>`;
  }
  return `<div class="text-sm text-gray-500">รูปแบบไม่รองรับ</div>`;
}

function startTimer(){
  renderTimer();
  clearInterval(CURRENT.tick);
  CURRENT.tick = setInterval(()=>{
    CURRENT.secs--;
    renderTimer();
    if (CURRENT.secs<=0){
      clearInterval(CURRENT.tick);
      submitExam();
    }
  }, 1000);
}
function renderTimer(){
  const m = Math.floor(CURRENT.secs/60).toString().padStart(2,'0');
  const s = (CURRENT.secs%60).toString().padStart(2,'0');
  examTimer.textContent = `${m}:${s}`;
}

async function submitExam(){
  const payload = { exam_id: CURRENT.id, answers: collectAnswers(), time_spent: 0 };
  if (window.Auth && window.Auth.profile && window.Auth.profile.id) payload.student_id = window.Auth.profile.id;
  const res = await apiPost('submitAttempt', payload);
  if (!res.ok) return toast(res.error,'error');
  toast('ส่งคำตอบแล้ว | คะแนน: '+res.data.score,'success');
  location.hash = '#/';
}

function collectAnswers(){
  const blocks = examQuestions.querySelectorAll('[data-q]');
  const arr = [];
  blocks.forEach(b=>{
    const qid = b.getAttribute('data-q');
    const r = b.querySelector('input[type=radio]:checked');
    const tfv = (b.querySelector('[data-tf]')||{}).dataset?.value;
    const inp = b.querySelector('input[type=text]');
    let ans = null;
    if (r) ans = r.value;
    else if (tfv) ans = tfv;
    else if (inp) ans = inp.value.trim();
    arr.push({ question_id: qid, answer_data: ans });
  });
  return arr;
}

// Re-apply pager on resize
window.addEventListener('resize', ()=>updateMobilePager());

// Router hook (hash style)
window.addEventListener('hashchange', ()=>{
  const m = location.hash.match(/#\/exam\/(.+)$/);
  if (m){ openExam(m[1]); }
});
