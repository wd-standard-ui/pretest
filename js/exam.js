// exam.js — ทำข้อสอบ (minimal) + timer
import { apiGet, apiPost } from './api.js';
import { toast, el } from './ui.js';

const viewExam = document.getElementById('view-exam');
const examTitle = document.getElementById('examTitle');
const examMeta = document.getElementById('examMeta');
const examTimer = document.getElementById('examTimer');
const examQuestions = document.getElementById('examQuestions');
const btnSubmit = document.getElementById('btnSubmitExam');

let CURRENT = { id: null, secs: 0, tick: null, answers: {} };

export async function openExam(examId){
  const res = await apiGet('getExam', { id: examId });
  if (!res.ok) return toast(res.error,'error');
  const { exam, questions } = res.data;

  CURRENT.id = exam.id;
  CURRENT.secs = (Number(exam.time_limit)||10) * 60;
  CURRENT.answers = {};

  examTitle.textContent = exam.title;
  examMeta.textContent = `เวลาทำ ${exam.time_limit} นาที | คะแนนผ่าน ${exam.passing_score}`;

  renderQuestions(questions);
  startTimer();

  btnSubmit.onclick = submitExam;
}

function renderQuestions(questions){
  examQuestions.innerHTML = '';
  questions.forEach((q, idx)=>{
    const box = el('div','card space-y-2');
    const imgs = (q.assets||[]).map(a=>`<img src="${a.thumb}" alt="${a.name}" class="rounded-lg max-h-48 object-contain">`).join('');
    box.innerHTML = `
      <div class="font-semibold">ข้อ ${idx+1}. ${q.question_text}</div>
      ${imgs?`<div class="grid grid-cols-2 gap-2">${imgs}</div>`:''}
      <div data-q="${q.id}">${renderInput(q)}</div>`;
    examQuestions.appendChild(box);
  });
}

function renderInput(q){
  if (q.question_type==='mcq'){
    return ['A','B','C','D'].map((k,i)=>`
      <label class="flex items-center gap-2">
        <input type="radio" name="q_${q.id}" value="${k}">
        <span>ตัวเลือก ${k}</span>
      </label>`).join('');
  }else if(q.question_type==='tf'){
    return `
      <div class="flex gap-3">
        <button class="px-3 py-2 rounded-xl border" onclick="this.closest('div').dataset.value='T'">ถูก</button>
        <button class="px-3 py-2 rounded-xl border" onclick="this.closest('div').dataset.value='F'">ผิด</button>
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
  const payload = {
    exam_id: CURRENT.id,
    answers: collectAnswers(),
    time_spent: 0
  };
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
    const tfv = b.dataset.value;
    const inp = b.querySelector('input[type=text]');
    let ans = null;
    if (r) ans = r.value;
    else if (tfv) ans = tfv;
    else if (inp) ans = inp.value.trim();
    arr.push({ question_id: qid, answer_data: ans });
  });
  return arr;
}

// Router hook (hash style)
window.addEventListener('hashchange', ()=>{
  const m = location.hash.match(/#\/exam\/(.+)$/);
  if (m){ openExam(m[1]); }
});
