// teacher.js — ครูจัดการชั้น/ข้อสอบ/คำถาม + อัปโหลดรูป
import { apiGet, apiPost } from './api.js';
import { toast, el } from './ui.js';

const selectClass = document.getElementById('selectClass');
const examList = document.getElementById('examList');
const btnNewExam = document.getElementById('btnNewExam');

const formQuestion = document.getElementById('formQuestion');
const qExamId = document.getElementById('qExamId');
const qOrder = document.getElementById('qOrder');
const qType = document.getElementById('qType');
const qPoints = document.getElementById('qPoints');
const qText = document.getElementById('qText');
const qFiles = document.getElementById('qFiles');

export async function render(){
  await loadClasses();
  selectClass.onchange = loadExams;
  btnNewExam.onclick = newExam;
  formQuestion.onsubmit = saveQuestion;
  await loadExams();
}

async function loadClasses(){
  const res = await apiGet('listClasses');
  if (!res.ok){ toast(res.error,'error'); return; }
  selectClass.innerHTML = '';
  (res.data||[]).forEach(c=>{
    const opt = el('option','',`${c.name} (${c.year})`);
    opt.value = c.id;
    selectClass.appendChild(opt);
  });
}

async function loadExams(){
  examList.innerHTML = '';
  const classId = selectClass.value;
  const res = await apiGet('listExams', { class_id: classId });
  if (!res.ok){ toast(res.error,'error'); return; }
  (res.data||[]).forEach(ex=>{
    const card = el('div','card space-y-2');
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">${ex.title}</div>
          <div class="text-xs text-gray-500">คะแนนผ่าน ${ex.passing_score} | เวลา ${ex.time_limit} นาที</div>
        </div>
        <span class="badge ${ex.is_published?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}">
          ${ex.is_published?'เผยแพร่แล้ว':'ฉบับร่าง'}
        </span>
      </div>
      <div class="flex gap-2">
        <button class="btn" data-id="${ex.id}" data-act="publish">${ex.is_published?'ปิดเผยแพร่':'เผยแพร่'}</button>
        <button class="px-3 py-2 rounded-xl border" data-id="${ex.id}" data-act="print">พิมพ์</button>
      </div>`;
    examList.appendChild(card);
  });
}

async function newExam(){
  const title = prompt('ชื่อข้อสอบ:');
  if (!title) return;
  const classId = selectClass.value;
  const payload = {
    title, class_id: classId, subject_id: 'math',
    total_score: 10, passing_score: 5, time_limit: 15, is_published: false
  };
  const res = await apiPost('upsertExam', payload);
  if (!res.ok) return toast(res.error,'error');
  toast('สร้างข้อสอบแล้ว');
  await loadExams();
}

async function saveQuestion(ev){
  ev.preventDefault();
  const examId = qExamId.value.trim();
  if (!examId) return toast('กรุณากรอก Exam ID','warning');

  const assets = [];
  if (qFiles.files && qFiles.files.length){
    for (const file of qFiles.files){
      const base64 = await toBase64(file);
      const resUp = await apiPost('uploadAsset', {
        exam_id: examId,
        name: file.name,
        mimeType: file.type,
        base64: base64.split(',')[1]
      });
      if (resUp.ok) assets.push(resUp.data);
    }
  }

  const payload = {
    exam_id: examId,
    order_index: Number(qOrder.value||1),
    question_type: qType.value,
    question_text: qText.value,
    question_data: {}, // สามารถใส่ตัวเลือก/จับคู่ ฯลฯ
    correct_answer: {}, // ตัวอย่าง minimal
    points: Number(qPoints.value||1),
    explain_text: '',
    assets
  };
  const res = await apiPost('upsertQuestion', payload);
  if (!res.ok) return toast(res.error,'error');
  toast('บันทึกคำถามแล้ว');
  formQuestion.reset();
}

function toBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}
