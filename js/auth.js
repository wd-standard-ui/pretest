// auth.js — LIFF login + appwd-like UX (guest preview allowed)
import { LIFF_ID } from './config.js';
import { apiPost } from './api.js';

const userBadge = document.getElementById('userBadge');
const avatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const heroAvatar = document.getElementById('heroAvatar');
const heroName = document.getElementById('heroName');
const heroRole = document.getElementById('heroRole');
const btnLogout = document.getElementById('btnLogout');
const btnLogin = document.getElementById('btnLineLogin');
const btnGuest = document.getElementById('btnGuest');

export const Auth = {
  profile: null,
  token: null,
  mode: 'line', // or 'guest'
  isLoggedIn: false,

  async init(){
    try{
      if (!LIFF_ID || LIFF_ID === 'YOUR_LIFF_ID_HERE') throw new Error('ยังไม่ได้ตั้ง LIFF_ID');
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()) {
        // แสดง welcome view จนกว่าจะกด login
        this.isLoggedIn = false;
        this.mode = 'guest';
        this.profile = { id:'GUEST', display_name:'โหมดตัวอย่าง', picture_url:'' };
        this._render();
        this._wire();
        return this.profile;
      }
      const idToken = liff.getIDToken();
      if (!idToken) throw new Error('ไม่พบ idToken');
      const res = await apiPost('authLine', { idToken });
      if (!res.ok) throw new Error(res.error||'authLine failed');

      this.token = res.data.sessionToken;
      this.profile = res.data.profile;
      this.mode = 'line';
      this.isLoggedIn = true;
      this._render();
      this._wire();
      return this.profile;
    }catch(err){
      console.warn('[Auth.init]', err.message);
      this.mode = 'guest';
      this.profile = { id:'GUEST', display_name:'โหมดตัวอย่าง', picture_url:'' };
      this.token = null;
      this.isLoggedIn = false;
      this._render();
      this._wire();
      return this.profile;
    }
  },

  login(){
    try{
      if (!LIFF_ID || typeof liff==='undefined') throw new Error('LIFF ไม่พร้อม');
      if (!liff.isLoggedIn()) liff.login({ redirectUri: location.href });
    }catch(err){ alert('เข้าสู่ระบบ LINE ไม่ได้: '+err.message); }
  },

  logout(){
    try{ if (liff.isLoggedIn()) liff.logout(); }catch(_){};
    location.reload();
  },

  _render(){
    // header badge
    userBadge?.classList.remove('hidden');
    if (this.profile?.picture_url) { avatar.src = this.profile.picture_url; heroAvatar.src = this.profile.picture_url; }
    userName.textContent = this.profile?.display_name || 'ผู้ใช้';
    userRole.textContent = this.mode==='line' ? 'LINE User' : 'Guest Preview';
    heroName.textContent = userName.textContent;
    heroRole.textContent = userRole.textContent;

    // toggle welcome/home
    const vw = document.getElementById('view-welcome');
    const vh = document.getElementById('view-home');
    if (this.isLoggedIn) { vw.classList.add('hidden'); vh.classList.remove('hidden'); }
    else { vw.classList.remove('hidden'); vh.classList.remove('hidden'); } // ทั้งสองพร้อม แต่ปุ่ม "เริ่มทำ" จะชวน login
  },

  _wire(){
    btnLogout && (btnLogout.onclick = ()=>this.logout());
    btnLogin && (btnLogin.onclick = ()=>this.login());
    btnGuest && (btnGuest.onclick = ()=>{
      this.mode = 'guest'; this.isLoggedIn = false;
      document.getElementById('view-welcome').classList.add('hidden');
      document.getElementById('view-home').classList.remove('hidden');
    });
  }
};

window.Auth = Auth; // expose for other modules
