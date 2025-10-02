/* api.js (non-module, global) */
(function(){
  // === Configuration ===
  var SCRIPT_URL = window.WD_EXAM_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxn1grHkvNUMaS_fod-RpR7tR4b9rm65YwzHZehoMKfVqZJCQYh-ElxzvrpfkFLfwCQ/exec'; // set window.WD_EXAM_SCRIPT_URL at runtime if you want
  var API_KEY = window.WD_EXAM_API_KEY || ''; // optional

  function httpPostJSON(path, payload){
    var url = SCRIPT_URL + path + (API_KEY? ('?key='+encodeURIComponent(API_KEY)) : '');
    return fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload||{})
    }).then(function(res){
      if(!res.ok) throw new Error('Network error');
      return res.json();
    });
  }

  function httpGetJSON(path, params){
    params = params||{};
    var q = new URLSearchParams(params);
    if(API_KEY) q.append('key', API_KEY);
    var url = SCRIPT_URL + path + '?' + q.toString();
    return fetch(url).then(function(res){
      if(!res.ok) throw new Error('Network error');
      return res.json();
    });
  }

  window.API = {
    listSubjects: function(){ return httpGetJSON('/subjects'); },
    listGrades: function(){ return httpGetJSON('/grades'); },
    listStudents: function(grade_id){ return httpGetJSON('/students', { grade_id: grade_id }); },
    listExams: function(subject_id, grade_id){ return httpGetJSON('/exams', { subject_id: subject_id, grade_id: grade_id }); },
    getExam: function(exam_id){ return httpGetJSON('/exam', { exam_id: exam_id }); },
    startAttempt: function(payload){ return httpPostJSON('/start', payload); },
    submitResult: function(payload){ return httpPostJSON('/submit', payload); },
  };
})();
