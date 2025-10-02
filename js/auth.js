// auth.js — LINE LIFF login (inside/outside) + Guest mode (no preflight)
import { LIFF_ID } from './config.js';
import { apiPost } from './api.js';

const userBadge = document.getElementById('userBadge');
const avatar = document.getElementById('userAvatar');
const nameEl = document.getElementById('userName');
const btnLogout = document.getElementById('btnLogout');
const btnLogin = document.getElementById('btnLineLogin');
const btnGuest = document.getElementById('btnGuest');

export const Auth = {
  profile: null,
  token: null,
  mode: 'line', // 'line' | 'guest'

  async init(){
    try{
      if (!LIFF_ID || LIFF_ID === 'YOUR_LIFF_ID_HERE') throw new Error('ยังไม่ได้ตั้ง LIFF_ID');
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()){
        // ใช้ redirectUri ปัจจุบัน เพื่อใช้ได้ทั้งใน/นอก LINE
        liff.login({ redirectUri: location.href });
        throw new Error('redirecting');
      }
      const idToken = liff.getIDToken();
      if (!idToken) throw new Error('ไม่มี idToken จาก LIFF');

      // ส่งแบบ urlencoded → ไม่โดน preflight/CORS
      const res = await apiPost('authLine', { idToken });
      if (!res.ok) throw new Error(res.error || 'authLine failed');

      this.token = res.data.sessionToken;
      this.profile = res.data.profile;
      this.mode = 'line';

      this._renderBadge();
      this._wireButtons();
      return this.profile;
    }catch(err){
      console.warn('[Auth.init]', err.message);
      // Guest mode (ใช้ได้เสมอนอก LINE)
      this.profile = { id: 'GUEST', display_name: 'Guest Mode', picture_url: '' };
      this.mode = 'guest';
      this.token = null;
      this._renderBadge();
      this._wireButtons();
      return this.profile;
    }
  },

  login(){
    try{
      if (typeof liff === 'undefined') throw new Error('LIFF SDK not loaded');
      if (!liff.isLoggedIn()) liff.login({ redirectUri: location.href });
    }catch(err){
      alert('ไม่สามารถเข้าสู่ระบบ LINE ได้: ' + err.message);
    }
  },

  logout(){
    try { if (typeof liff !== 'undefined' && liff.isLoggedIn()) liff.logout(); } catch(_) {}
    location.reload();
  },

  _renderBadge(){
    userBadge?.classList.remove('hidden');
    if (this.profile?.picture_url && avatar) avatar.src = this.profile.picture_url;
    if (nameEl) nameEl.textContent = this.profile?.display_name || (this.mode==='guest' ? 'Guest Mode' : 'ผู้ใช้');
  },

  _wireButtons(){
    if (btnLogout) btnLogout.onclick = ()=>this.logout();
    if (btnLogin) btnLogin.onclick = ()=>this.login();
    if (btnGuest) btnGuest.onclick = ()=>{
      alert('โหมดทดสอบ: จะไม่บันทึกผู้ใช้จริง แต่สามารถลองทำข้อสอบได้');
      location.hash = '#/';
    };
  }
};
