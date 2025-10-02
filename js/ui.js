// ui.js — toast/skeleton/DOM helpers (ไทย)
export function toast(text, icon='success'){
  // ใช้ SweetAlert2
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    icon,
    title: text
  });
}

export function el(tag, className='', html=''){
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

export function mountHeaderHandlers(){
  // ที่หัวหน้าเว็บ (logout ทำใน auth.js แล้ว)
}
