/**
 * Basit istemci-tarafı parola koruması.
 * Parolanın SHA-256 hash'i localStorage'da saklanır; düz metin tutulmaz.
 *
 * NOT: Bu, sunucusuz statik bir uygulama olduğu için gerçek
 * sunucu kimlik doğrulaması değildir; aynı tarayıcıyı paylaşan başka bir
 * kişinin "Geliştirici Araçları"nı açıp localStorage'a müdahale etmesine
 * karşı kriptografik koruma sağlamaz. Asıl güvenlik şudur:
 *  - API anahtarları sadece bu tarayıcıda
 *  - Şifre, başka birinin uygulamayı kullanmasını engellemek için
 */
const Auth = (() => {
  const PWD_KEY = 'tramer_ai_pwd_hash_v1';
  const SESSION_KEY = 'tramer_ai_session_v1';
  const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 saat

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isSetup() {
    return !!localStorage.getItem(PWD_KEY);
  }

  async function setup(pwd) {
    if (!pwd || pwd.length < 6) throw new Error('En az 6 karakter olmalı.');
    const hash = await sha256(pwd);
    localStorage.setItem(PWD_KEY, hash);
    grantSession();
  }

  async function login(pwd) {
    const stored = localStorage.getItem(PWD_KEY);
    if (!stored) throw new Error('Önce parola kurun.');
    const hash = await sha256(pwd);
    if (hash !== stored) throw new Error('Parola hatalı.');
    grantSession();
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function grantSession() {
    const exp = Date.now() + SESSION_TTL_MS;
    localStorage.setItem(SESSION_KEY, String(exp));
  }

  function hasValidSession() {
    const exp = parseInt(localStorage.getItem(SESSION_KEY) || '0', 10);
    return exp > Date.now();
  }

  async function changePassword(oldPwd, newPwd) {
    await login(oldPwd); // doğrulama
    await setup(newPwd);
  }

  function resetAll() {
    // Tüm uygulama verilerini siler
    Object.keys(localStorage)
      .filter(k => k.startsWith('tramer_ai_') || k === 'kusuranaliz_history_v3')
      .forEach(k => localStorage.removeItem(k));
  }

  function resetPasswordOnly() {
    localStorage.removeItem(PWD_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  return {
    isSetup, setup, login, logout,
    hasValidSession,
    changePassword, resetAll, resetPasswordOnly,
    sha256,
  };
})();

if (typeof window !== 'undefined') window.Auth = Auth;
