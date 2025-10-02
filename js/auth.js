// auth.js — LINE LIFF outside/inside + guest mode
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
  mode: 'line', // or 'guest'

  async init(){
    // พยายาม init LIFF ปกติ (ทำงานทั้งใน LINE และเบราว์เซอร์ทั่วไป)
    try{
      if (!LIFF_ID || LIFF_ID === 'YOUR_LIFF_ID_HERE') throw new Error('No LIFF_ID configured');
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()){
        // ถ้าเปิดนอก LINE ให้ใช้ redirectUri ปัจจุบัน
        liff.login({ redirectUri: location.href });
        throw new Error('redirecting');
      }
      const idToken = liff.getIDToken();
      if (!idToken) throw new Error('No idToken from LIFF');
      const res = await apiPost('authLine', { idToken });
      if (!res.ok) throw new Error(res.error||'Auth failed');
      this.token = res.data.sessionToken;
      this.profile = res.data.profile;
      this.mode = 'line';
      this._renderBadge();
      this._mountGuestFallback();
      return this.profile;
    }catch(err){
      // เปิดโหมด guest ได้ (เหมือน WDBank ที่ยังใช้งานได้บนเว็บ)
      console.warn('[Auth.init]', err.message);
      this.mode = 'guest';
      this.profile = { id:'GUEST', display_name:'Guest Mode', picture_url:'' };
      this.token = null;
      this._renderBadge();
      this._mountGuestFallback();
      return this.profile;
    }
  },

  login(){
    try{
      if (typeof liff === 'undefined') throw new Error('LIFF SDK not loaded');
      if (!liff.isLoggedIn()){
        liff.login({ redirectUri: location.href });
      }
    }catch(err){
      alert('ไม่สามารถเข้าสู่ระบบ LINE ได้: '+err.message);
    }
  },

  _renderBadge(){
    userBadge.classList.remove('hidden');
    if (this.profile.picture_url) avatar.src = this.profile.picture_url;
    nameEl.textContent = this.profile.display_name || (this.mode==='guest'?'Guest Mode':'ผู้ใช้');
    btnLogout.onclick = ()=>{
      if (this.mode==='line'){ try{ liff.logout(); }catch(_){} }
      location.reload();
    };
  },

  _mountGuestFallback(){
    if (btnLogin) btnLogin.onclick = ()=>this.login();
    if (btnGuest) btnGuest.onclick = ()=>{
      alert('โหมดทดสอบ: จะไม่บันทึกผู้ใช้จริง แต่สามารถลองทำข้อสอบได้');
      location.hash = '#/';
    };
  }
};
