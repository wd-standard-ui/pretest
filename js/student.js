// student.js — นักเรียนเห็นข้อสอบและประวัติ
import { apiGet } from './api.js';
import { toast, el } from './ui.js';

const openExams = document.getElementById('openExams');

export async function render(){
  await loadOpen();
  // TODO: โหลดประวัติ (starter ปล่อยว่าง)
}

async function loadOpen(){
  openExams.innerHTML = '';
  const res = await apiGet('listOpenExams');
  if (!res.ok){ toast(res.error,'error'); return; }
  (res.data||[]).forEach(ex=>{
    const card = el('div','card space-y-2');
    card.innerHTML = `
      <div class="font-semibold">${ex.title}</div>
      <div class="text-xs text-gray-500">คะแนนผ่าน ${ex.passing_score} | เวลา ${ex.time_limit} นาที</div>
      <button class="btn" data-id="${ex.id}">เริ่มทำข้อสอบ</button>`;
    const btn = card.querySelector('button');
    btn.onclick = ()=>location.hash = '#/exam/'+ex.id;
    openExams.appendChild(card);
  });
}
