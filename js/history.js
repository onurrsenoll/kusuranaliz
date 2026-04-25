/**
 * Geçmiş Yöneticisi
 * localStorage üzerinde son 100 analizi saklar.
 *
 * Kayıt şeması:
 *  {
 *    id:           string  (UUID)
 *    savedAt:      ISO timestamp
 *    scenarioId:   number
 *    scenarioTitle:string
 *    scenarioCategory: string
 *    plateA, driverA, insurerA: string
 *    plateB, driverB, insurerB: string
 *    accidentDate: string (ISO)
 *    accidentLocation: string
 *    notes:        string
 *    faultA:       number (0..100)
 *    faultB:       number (0..100)
 *    lawRef:       string
 *  }
 */
const HISTORY_KEY = 'kusuranaliz_history_v3';
const HISTORY_MAX = 100;

const History = {
  /** Tüm kayıtları döndürür (en yeni başta). */
  list() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error('Geçmiş okunamadı:', e);
      return [];
    }
  },

  /** Yeni bir kayıt ekler ve geri döndürür. */
  add(record) {
    const all = this.list();
    const item = {
      id: this._uuid(),
      savedAt: new Date().toISOString(),
      ...record,
    };
    all.unshift(item);
    if (all.length > HISTORY_MAX) all.length = HISTORY_MAX;
    this._save(all);
    return item;
  },

  /** ID ile tek bir kaydı döndürür. */
  get(id) {
    return this.list().find(r => r.id === id) || null;
  },

  /** ID ile bir kaydı siler. */
  remove(id) {
    const all = this.list().filter(r => r.id !== id);
    this._save(all);
    return all;
  },

  /** Tüm geçmişi temizler. */
  clear() {
    localStorage.removeItem(HISTORY_KEY);
  },

  /** İç: kayıt yardımcısı */
  _save(arr) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error('Geçmiş yazılamadı:', e);
    }
  },

  /** İç: basit UUID üretici (RFC4122 v4 değil ama yeterince benzersiz) */
  _uuid() {
    return 'k_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 10);
  },
};

if (typeof window !== 'undefined') window.History = History;
