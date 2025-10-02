/* api.js */
// === Configuration ===
export const SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE'; // << ใส่ Web App URL ของ Apps Script
export const API_KEY = ''; // (optional) ใช้คู่กับ Apps Script ถ้าต้องการตรวจสอบอย่างง่าย

// === HTTP helpers ===
async function httpPostJSON(path, payload){
  const url = `${SCRIPT_URL}${path}` + (API_KEY?`?key=${encodeURIComponent(API_KEY)}`:'');
  const res = await fetch(url, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(payload||{})
  });
  if(!res.ok) throw new Error('Network error');
  return await res.json();
}

async function httpGetJSON(path, params={}){
  const q = new URLSearchParams(params);
  if(API_KEY) q.append('key', API_KEY);
  const url = `${SCRIPT_URL}${path}?` + q.toString();
  const res = await fetch(url);
  if(!res.ok) throw new Error('Network error');
  return await res.json();
}

// === Public API ===
export const API = {
  listSubjects(){ return httpGetJSON('/subjects'); },
  listGrades(){ return httpGetJSON('/grades'); },
  listStudents(grade_id){ return httpGetJSON('/students', { grade_id }); },
  listExams(subject_id, grade_id){ return httpGetJSON('/exams', { subject_id, grade_id }); },
  getExam(exam_id){ return httpGetJSON('/exam', { exam_id }); },
  startAttempt(payload){ return httpPostJSON('/start', payload); },
  submitResult(payload){ return httpPostJSON('/submit', payload); },
};
