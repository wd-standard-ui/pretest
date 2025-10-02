// ui.js — small helpers
export function el(tag, cls){
  const d = document.createElement(tag); if (cls) d.className = cls; return d;
}
export function toast(msg, type='info'){
  if (window.Swal) return Swal.fire({ title: msg, icon: type, timer: 1600, showConfirmButton:false });
  alert(msg);
}
