// auth.js — LINE LIFF only
import { LIFF_ID } from './config.js';
import { apiPost } from './api.js';

const userBadge = document.getElementById('userBadge');
const avatar = document.getElementById('userAvatar');
const nameEl = document.getElementById('userName');
const btnLogout = document.getElementById('btnLogout');
const btnLogin = document.getElementById('btnLineLogin');

export const Auth = {
  profile: null,
  token: null,

  async init(){
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) throw new Error('Not logged in');
    const idToken = liff.getIDToken();
    if (!idToken) throw new Error('No idToken from LIFF');

    const res = await apiPost('authLine', { idToken });
    if (!res.ok) throw new Error(res.error||'Auth failed');
    this.token = res.data.sessionToken;
    this.profile = res.data.profile;

    userBadge.classList.remove('hidden');
    if (this.profile.picture_url) avatar.src = this.profile.picture_url;
    nameEl.textContent = this.profile.display_name || 'ผู้ใช้';

    btnLogout.onclick = ()=>{
      liff.logout();
      location.reload();
    };
    return this.profile;
  },

  login(){
    if (!liff.isLoggedIn()) liff.login();
  }
};
