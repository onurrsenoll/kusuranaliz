/**
 * Ayarlar yöneticisi.
 *  - API anahtarları sağlayıcı bazında localStorage'da saklanır.
 *  - Aktif sağlayıcı seçilir.
 *  - Test sonuçları (son test) hatırlanır.
 */
const Settings = (() => {
  const KEY = 'tramer_ai_settings_v1';

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function _save(s) {
    localStorage.setItem(KEY, JSON.stringify(s));
  }

  function getAll() {
    const s = _load();
    return {
      activeProvider: s.activeProvider || 'openrouter',
      providers: s.providers || {},
    };
  }

  function getProvider(id) {
    const s = _load();
    return (s.providers && s.providers[id]) || { apiKey: '', lastTest: null };
  }

  function setProvider(id, patch) {
    const s = _load();
    s.providers = s.providers || {};
    s.providers[id] = { ...(s.providers[id] || {}), ...patch };
    _save(s);
  }

  function setActiveProvider(id) {
    const s = _load();
    s.activeProvider = id;
    _save(s);
  }

  function getActiveProvider() {
    const s = _load();
    return s.activeProvider || 'openrouter';
  }

  function getActiveApiKey() {
    const id = getActiveProvider();
    const cfg = getProvider(id);
    return { providerId: id, apiKey: cfg.apiKey || '' };
  }

  return {
    getAll, getProvider, setProvider,
    setActiveProvider, getActiveProvider, getActiveApiKey,
  };
})();

if (typeof window !== 'undefined') window.Settings = Settings;
