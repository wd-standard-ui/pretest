// app.js — SPA bootstrap + routing
import { Auth } from './auth.js';
import * as API from './api.js';
import * as UI from './ui.js';
import * as Teacher from './teacher.js';
import * as Student from './student.js';
import * as Exam from './exam.js';

const views = {
  login: document.getElementById('view-login'),
  teacher: document.getElementById('view-teacher'),
  student: document.getElementById('view-student'),
  exam: document.getElementById('view-exam'),
  print: document.getElementById('view-print')
};

function show(id){
  Object.values(views).forEach(v=>v.classList.add('hidden'));
  (views[id]||views.login).classList.remove('hidden');
}

async function boot(){
  UI.mountHeaderHandlers();
  try{
    await Auth.init();
    window.Auth = Auth;
    UI.toast('เข้าสู่ระบบสำเร็จ','success');
    const me = Auth.profile;
    if (me.role === 'teacher' || me.role === 'admin'){
      show('teacher');
      await Teacher.render();
    } else {
      show('student');
      await Student.render();
    }
  }catch(err){
    console.warn(err);
    show('login');
    UI.toast('กรุณาเข้าสู่ระบบด้วย LINE','info');
    document.getElementById('btnLineLogin').onclick = ()=>Auth.login();
  }
}

window.addEventListener('DOMContentLoaded', boot);
