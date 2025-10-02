/* app.js */
const API = window.API;

const dom = sel => document.querySelector(sel);
const show = id => document.getElementById(id).classList.remove('hidden');
const hide = id => document.getElementById(id).classList.add('hidden');

const AppState = {
  subject: null,
  grade: null,
  student: null,
  exam: null,
  questions: [],
  answers: {}, // {question_id: value}
  startTime: null,
  endTime: null,
  timeLimitSec: 0,
  timer: null,
  elapsed: 0,

  // desktop pagination
  page: 1,
  perPage: 4,
};

function fmtTime(sec){
  const m = Math.floor(sec/60); const s = sec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function saveLocal(){
  localStorage.setItem('WD_EXAM_STATE', JSON.stringify({
    subject:AppState.subject, grade:AppState.grade, student:AppState.student,
    exam:AppState.exam, answers:AppState.answers, elapsed:AppState.elapsed
  }));
}
function restoreLocal(){
  try{
    const raw = localStorage.getItem('WD_EXAM_STATE');
    if(!raw) return;
    const st = JSON.parse(raw);
    Object.assign(AppState, st);
  }catch(e){}
}

async function boot(){
  restoreLocal();
  bindGlobal();
  await renderSubjects();
}

function bindGlobal(){
  dom('#btnPrint').onclick = ()=> window.print();
  dom('#btnPrintNow').onclick = ()=> window.print();
}

async function renderSubjects(){
  hide('view-setup'); hide('view-instructions'); hide('view-exam'); hide('view-result');
  show('view-loading');
  try{
    const [subjects, grades] = await Promise.all([API.listSubjects(), API.listGrades()]);
    const box = dom('#subjectGrid'); box.innerHTML = '';
    subjects.data.forEach(s=>{
      const btn = document.createElement('button');
      btn.className = 'p-4 bg-white rounded-2xl shadow-card hover:shadow-md text-left';
      btn.innerHTML = `<div class="text-lg font-semibold">${s.name_th}</div>
        <div class="text-xs text-gray-500">${s.name_en}</div>`;
      btn.onclick = ()=> chooseSubject(s, grades.data);
      box.appendChild(btn);
    });
    hide('view-loading'); show('view-subjects');
  }catch(e){
    console.error(e); alert('โหลดข้อมูลไม่สำเร็จ');
  }
}

async function chooseSubject(subject, grades){
  AppState.subject = subject;
  hide('view-subjects'); show('view-setup');
  const selGrade = dom('#selGrade'), selStudent = dom('#selStudent'), selExam = dom('#selExam');
  selGrade.innerHTML = grades.map(g=>`<option value="${g.id}">${g.name_th}</option>`).join('');
  selGrade.onchange = refreshStudentsAndExams;
  dom('#btnBackToSubjects').onclick = renderSubjects;
  dom('#btnContinue').onclick = toInstructions;

  async function refreshStudentsAndExams(){
    const grade_id = selGrade.value;
    const [students, exams] = await Promise.all([API.listStudents(grade_id), API.listExams(subject.id, grade_id)]);
    selStudent.innerHTML = students.data.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
    selExam.innerHTML = exams.data.map(x=>`<option value="${x.id}">${x.title}</option>`).join('');
  }
  await refreshStudentsAndExams();
}

function toInstructions(){
  const grade_id = dom('#selGrade').value;
  const student_id = dom('#selStudent').value;
  const student_name = dom('#selStudent').selectedOptions[0]?.textContent || '';
  const exam_id = dom('#selExam').value;
  AppState.grade = { id:grade_id };
  AppState.student = { id:student_id, name:student_name };
  AppState.exam = { id:exam_id };
  hide('view-setup'); show('view-instructions');
  dom('#btnBackToSetup').onclick = ()=>{ hide('view-instructions'); show('view-setup'); };
  dom('#btnStart').onclick = startExam;
}

async function startExam(){
  try{
    const ex = await API.getExam(AppState.exam.id);
    AppState.questions = ex.data.questions || [];
    AppState.timeLimitSec = ex.data.time_limit_sec || 0;
    AppState.perPage = ex.data.items_per_page || 4;
    AppState.answers = {};
    AppState.elapsed = 0;
    saveLocal();

    // Start record
    await API.startAttempt({
      exam_id: AppState.exam.id,
      student_id: AppState.student.id,
      student_name: AppState.student.name,
      grade_id: AppState.grade.id,
      subject_id: AppState.subject.id,
      ts: Date.now()
    });

    // view
    hide('view-instructions'); show('view-exam');

    // badges
    dom('#badgeSubject').textContent = AppState.subject.name_th;
    dom('#badgeGrade').textContent = AppState.grade.id;

    // timer
    if(AppState.timer) clearInterval(AppState.timer);
    AppState.timer = setInterval(()=>{
      AppState.elapsed++;
      dom('#timerText').textContent = fmtTime(AppState.timeLimitSec? (Math.max(0, AppState.timeLimitSec - AppState.elapsed)) : AppState.elapsed);
      const progress = AppState.timeLimitSec? (AppState.elapsed / AppState.timeLimitSec) : (Object.keys(AppState.answers).length / AppState.questions.length);
      dom('#progressBar').style.width = Math.min(100, Math.round(progress*100)) + '%';
      if(AppState.timeLimitSec && AppState.elapsed>=AppState.timeLimitSec){
        clearInterval(AppState.timer);
        submitExam();
      }
      saveLocal();
    }, 1000);

    // bind mobile
    let idx = 0;
    function renderMobile(){
      const q = AppState.questions[idx];
      dom('#mobileQuestionContainer').innerHTML = renderQuestion(q, idx+1);
      bindAnswerInputs(q);
    }
    dom('#btnPrev').onclick = ()=>{ if(idx>0){ idx--; renderMobile(); } };
    dom('#btnNext').onclick = ()=>{
      if(idx < AppState.questions.length-1){ idx++; renderMobile(); }
      else { submitExam(); }
    }

    // bind desktop
    AppState.page = 1;
    function renderDesktop(){
      const start = (AppState.page-1)*AppState.perPage;
      const slice = AppState.questions.slice(start, start+AppState.perPage);
      dom('#desktopQuestionContainer').innerHTML = slice.map((q,i)=> `<div class="question p-4 bg-white rounded-2xl shadow-card">${renderQuestion(q, start+i+1, true)}</div>`).join('');
      slice.forEach(q=> bindAnswerInputs(q));
      dom('#pageInfo').textContent = `หน้า ${AppState.page} / ${Math.ceil(AppState.questions.length/AppState.perPage)}`;
    }
    dom('#btnPagePrev').onclick = ()=>{ if(AppState.page>1){ AppState.page--; renderDesktop(); } };
    dom('#btnPageNext').onclick = ()=>{
      const max = Math.ceil(AppState.questions.length/AppState.perPage);
      if(AppState.page<max){ AppState.page++; renderDesktop(); }
    };
    dom('#btnSubmit').onclick = submitExam;

    // initial render
    renderMobile();
    renderDesktop();
  }catch(e){
    console.error(e); alert('เริ่มข้อสอบไม่สำเร็จ');
  }
}

function renderQuestion(q, number, compact=false){
  const answer = AppState.answers[q.id] || null;
  const header = `<div class="mb-2"><span class="text-gray-500">ข้อ ${number}</span> — <span class="font-semibold">${q.points||1} คะแนน</span></div>`;
  const media = q.media ? `<img src="${q.media}" class="rounded-lg max-h-56 mb-2">` : '';
  const prompt = `<div class="mb-2">${q.prompt||''}</div>`;

  if(q.type==='fill'){
    return `${header}${media}${prompt}
      <input data-qid="${q.id}" type="text" class="w-full border rounded-xl px-3 py-2" placeholder="พิมพ์คำตอบ" value="${answer||''}">`;
  }

  // choices
  const choices = ['A','B','C','D'].map(k=> q[`choice_${k.toLowerCase()}`]).filter(Boolean);
  const inputs = choices.map((text, i)=>{
    const key = ['A','B','C','D'][i];
    const checked = (answer===key || (Array.isArray(answer)&&answer.includes(key))) ? 'checked' : '';
    const type = (q.type==='multiple' ? 'checkbox' : 'radio');
    const name = `q_${q.id}`;
    return `<label class="choice"><input data-qid="${q.id}" data-key="${key}" type="${type}" name="${name}" ${checked}> <span>${text}</span></label>`;
  }).join('');

  return `${header}${media}${prompt}<div class="space-y-2">${inputs}</div>`;
}

function bindAnswerInputs(q){
  const inputs = document.querySelectorAll(`[data-qid="${q.id}"]`);
  inputs.forEach(inp=>{
    inp.onchange = ()=>{
      if(q.type==='multiple'){
        const selected = Array.from(document.querySelectorAll(`input[name="q_${q.id}"]:checked`)).map(el=>el.getAttribute('data-key'));
        AppState.answers[q.id] = selected;
      }else if(q.type==='fill'){
        AppState.answers[q.id] = inp.value.trim();
      }else{
        AppState.answers[q.id] = inp.getAttribute('data-key');
      }
      saveLocal();
    };
    if(q.type==='fill'){
      inp.oninput = ()=>{
        AppState.answers[q.id] = inp.value.trim();
        saveLocal();
      };
    }
  });
}

async function submitExam(){
  try{
    if(AppState.timer) clearInterval(AppState.timer);
    AppState.endTime = Date.now();
    // scoring
    let score = 0, max = 0, details=[];
    for(const q of AppState.questions){
      const ans = AppState.answers[q.id];
      const correct = q.correct;
      const points = Number(q.points||1);
      max += points;
      let ok = false;
      if(q.type==='fill'){
        ok = (String(ans||'').trim().toLowerCase() === String(correct||'').trim().toLowerCase());
      }else if(q.type==='multiple'){
        const setA = new Set((ans||[]).map(x=>x.toUpperCase()));
        const setB = new Set(String(correct||'').split('|').map(x=>x.trim().toUpperCase()));
        ok = setA.size===setB.size && [...setA].every(x=> setB.has(x));
      }else{
        ok = String(ans||'').toUpperCase() === String(correct||'').toUpperCase();
      }
      if(ok) score += points;
      details.push({ qid:q.id, ans, correct, points, ok });
    }

    const payload = {
      exam_id: AppState.exam.id,
      student_id: AppState.student.id,
      student_name: AppState.student.name,
      grade_id: AppState.grade.id,
      subject_id: AppState.subject.id,
      start_time: Date.now() - (AppState.elapsed*1000),
      end_time: Date.now(),
      duration_sec: AppState.elapsed,
      score, max_score: max,
      details
    };
    const res = await API.submitResult(payload);
    showResult(score, max, res?.data?.result_id);
    localStorage.removeItem('WD_EXAM_STATE');
  }catch(e){
    console.error(e);
    alert('ส่งคำตอบไม่สำเร็จ');
  }
}

function showResult(score, max, resultId){
  hide('view-exam'); show('view-result');
  dom('#resultBox').innerHTML = `
    <div class="text-lg font-semibold">คะแนนของคุณ: ${score} / ${max}</div>
    <div class="text-sm text-gray-600 mt-1">Result ID: ${resultId||'-'}</div>
  `;
  dom('#btnFinish').onclick = boot;
}

boot();
