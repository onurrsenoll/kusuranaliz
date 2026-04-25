/**
 * TRAMER AI — Ana uygulama akışı.
 * Sırayla:
 *   1. Login / setup ekranı
 *   2. Ana uygulama (3 sekme: analiz / geçmiş / ayarlar)
 *   3. Görsel yükle → AI'ya gönder → senaryo eşle → kusur veritabanından gelir
 */
(function () {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const HISTORY_KEY = 'tramer_ai_history_v1';

  // İç durum
  const state = {
    files: [],          // { name, dataUrl, size }[]
    lastResult: null,   // analiz çıktısı + form
  };

  // ============ Başlat ============
  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initLogin();
  });

  // ============ Tema ============
  function initTheme() {
    const t = localStorage.getItem('tramer_ai_theme') || 'dark';
    if (t === 'light') document.body.classList.add('light');
    document.addEventListener('click', e => {
      if (e.target.id === 'themeToggle') {
        document.body.classList.toggle('light');
        localStorage.setItem('tramer_ai_theme',
          document.body.classList.contains('light') ? 'light' : 'dark');
      }
    });
  }

  // ============ Login akışı ============
  function initLogin() {
    const setupForm = $('#setupForm');
    const loginForm = $('#loginForm');
    const msg = $('#loginMsg');

    function showMsg(text, ok = false) {
      msg.textContent = text;
      msg.classList.toggle('success', !!ok);
      msg.hidden = false;
    }

    if (Auth.hasValidSession()) {
      enterApp();
      return;
    }

    if (Auth.isSetup()) {
      loginForm.hidden = false;
    } else {
      setupForm.hidden = false;
    }

    setupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const p1 = $('#setupPwd1').value;
      const p2 = $('#setupPwd2').value;
      if (p1 !== p2) return showMsg('Parolalar eşleşmiyor.');
      try {
        await Auth.setup(p1);
        showMsg('Parola kaydedildi. Yönlendiriliyor…', true);
        setTimeout(enterApp, 600);
      } catch (err) { showMsg(err.message); }
    });

    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const pwd = $('#loginPwd').value;
      try {
        await Auth.login(pwd);
        enterApp();
      } catch (err) { showMsg(err.message); }
    });

    $('#forgotBtn').addEventListener('click', () => {
      if (!confirm('Parola sıfırlandığında geçmiş analizler ve ayarlar SİLİNMEZ; sadece parola sıfırlanır. Devam edilsin mi?')) return;
      Auth.resetPasswordOnly();
      location.reload();
    });
  }

  function enterApp() {
    $('#loginScreen').style.display = 'none';
    $('#app').hidden = false;
    initTabs();
    initSettingsTab();
    initAnalyzeTab();
    initHistoryTab();
    initTopActions();
  }

  // ============ Üst bar aksiyonları ============
  function initTopActions() {
    $('#logoutBtn').addEventListener('click', () => {
      Auth.logout();
      location.reload();
    });
  }

  // ============ Sekme yönetimi ============
  function initTabs() {
    $$('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        $$('.tab').forEach(b => b.classList.toggle('active', b === btn));
        $$('.tab-panel').forEach(p =>
          p.classList.toggle('active', p.id === `tab-${tab}`));
        if (tab === 'history') renderHistory();
        if (tab === 'settings') renderSettings();
      });
    });
  }

  // ============ AYARLAR sekmesi ============
  function initSettingsTab() {
    renderSettings();

    $('#saveSettingsBtn').addEventListener('click', () => {
      const id = $('#activeProvider').value;
      Settings.setActiveProvider(id);
      AIProviders.list().forEach(p => {
        const inp = $(`#key-${p.id}`);
        const modelSel = $(`#model-${p.id}`);
        if (inp) {
          const patch = { apiKey: inp.value.trim() };
          if (modelSel) patch.model = modelSel.value;
          Settings.setProvider(p.id, patch);
        }
      });
      toast('Ayarlar kaydedildi.', 'success');
    });

    $('#changePwdBtn').addEventListener('click', async () => {
      const oldP = prompt('Mevcut parola:');
      if (oldP === null) return;
      const newP = prompt('Yeni parola (en az 6 karakter):');
      if (newP === null) return;
      try {
        await Auth.changePassword(oldP, newP);
        toast('Parola değiştirildi.', 'success');
      } catch (e) { toast(e.message, 'error'); }
    });

    $('#resetAllBtn').addEventListener('click', () => {
      if (!confirm('TÜM AYARLAR, PAROLA, GEÇMİŞ ve API ANAHTARLARI silinecek. Emin misiniz?')) return;
      Auth.resetAll();
      location.reload();
    });
  }

  function renderSettings() {
    const list = $('#providersList');
    const sel = $('#activeProvider');
    list.innerHTML = '';
    sel.innerHTML = '';

    const all = Settings.getAll();
    AIProviders.list().forEach(p => {
      const cfg = Settings.getProvider(p.id);
      const last = cfg.lastTest;

      // Aktif sağlayıcı dropdown
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      if (all.activeProvider === p.id) opt.selected = true;
      sel.appendChild(opt);

      // Sağlayıcı kartı
      const card = document.createElement('div');
      card.className = 'provider' + (last?.ok ? ' ok' : last?.ok === false ? ' fail' : '');
      const statusClass = last ? (last.ok ? 'ok' : 'fail') : 'unknown';
      const statusText = last ? (last.ok ? '✓ ÇALIŞIYOR' : '✗ HATA') : 'Test edilmedi';

      // Model seçici (yalnızca model listesi olan sağlayıcılar için, örn. OpenRouter)
      const currentModel = cfg.model || p.defaultModel;
      const modelHtml = (Array.isArray(p.models) && p.models.length) ? `
        <label class="field">
          <span>Model</span>
          <select id="model-${p.id}">
            ${p.models.map(m =>
              `<option value="${escapeHtml(m.id)}" ${m.id === currentModel ? 'selected' : ''}>${escapeHtml(m.label)}</option>`
            ).join('')}
          </select>
        </label>` : '';

      card.innerHTML = `
        <div class="provider-head">
          <div class="provider-title">
            <div class="provider-icon">${p.icon}</div>
            <div>
              ${escapeHtml(p.label)}
              <a href="${p.docsUrl}" target="_blank" rel="noopener" class="muted small" style="display:block;font-weight:400;">Anahtar al →</a>
            </div>
          </div>
          <span class="provider-status ${statusClass}" id="status-${p.id}">${statusText}</span>
        </div>
        <label class="field">
          <span>API Anahtarı</span>
          <input type="password" id="key-${p.id}" placeholder="${escapeHtml(p.placeholder)}" value="${escapeHtml(cfg.apiKey || '')}" autocomplete="off"/>
        </label>
        ${modelHtml}
        <div class="provider-actions">
          <button class="btn-ghost" data-test="${p.id}">🔌 Test Et</button>
          <button class="btn-ghost" data-show="${p.id}">👁 Göster</button>
        </div>
        <div class="provider-test-msg" id="msg-${p.id}">${last ? escapeHtml(last.message || '') + ' · ' + new Date(last.at).toLocaleString('tr-TR') : ''}</div>
      `;
      list.appendChild(card);
    });

    // Test butonları
    list.querySelectorAll('button[data-test]').forEach(btn => {
      btn.addEventListener('click', () => testProvider(btn.dataset.test));
    });
    list.querySelectorAll('button[data-show]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = $(`#key-${btn.dataset.show}`);
        inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    });
    // Model dropdown anlık kayıt (Test Et için)
    list.querySelectorAll('select[id^="model-"]').forEach(sel => {
      sel.addEventListener('change', () => {
        const id = sel.id.replace('model-', '');
        Settings.setProvider(id, { model: sel.value });
      });
    });
  }

  async function testProvider(id) {
    const provider = AIProviders.get(id);
    if (!provider) return;
    const key = $(`#key-${id}`).value.trim();
    const modelSel = $(`#model-${id}`);
    const patch = { apiKey: key };
    if (modelSel) patch.model = modelSel.value;
    Settings.setProvider(id, patch);

    const status = $(`#status-${id}`);
    const msg = $(`#msg-${id}`);
    status.className = 'provider-status testing';
    status.textContent = '… Test ediliyor';
    msg.textContent = 'Bağlanılıyor…';

    try {
      const r = await provider.testKey(key);
      const stamp = new Date().toISOString();
      Settings.setProvider(id, {
        apiKey: key,
        lastTest: { ok: r.ok, message: r.message, at: stamp },
      });
      status.className = 'provider-status ' + (r.ok ? 'ok' : 'fail');
      status.textContent = r.ok ? '✓ ÇALIŞIYOR' : '✗ HATA';
      msg.textContent = r.message + ' · ' + new Date(stamp).toLocaleString('tr-TR');
      toast(r.ok ? `${provider.label} bağlantısı OK` : `${provider.label}: ${r.message}`,
        r.ok ? 'success' : 'error');
    } catch (e) {
      const stamp = new Date().toISOString();
      Settings.setProvider(id, { apiKey: key, lastTest: { ok: false, message: e.message, at: stamp } });
      status.className = 'provider-status fail';
      status.textContent = '✗ HATA';
      msg.textContent = e.message;
      toast(e.message, 'error');
    }
  }

  // ============ ANALİZ sekmesi ============
  function initAnalyzeTab() {
    const dz = $('#dropzone');
    const inp = $('#fileInput');

    dz.addEventListener('click', () => inp.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    inp.addEventListener('change', e => handleFiles(e.target.files));

    $('#analyzeBtn').addEventListener('click', runAnalysis);
    $('#clearBtn').addEventListener('click', clearAnalysis);

    $('#btnSaveAi').addEventListener('click', saveCurrentResult);
    $('#btnPdfAi').addEventListener('click', () => exportCurrent('pdf'));
    $('#btnXlsxAi').addEventListener('click', () => exportCurrent('xlsx'));
  }

  async function handleFiles(fileList) {
    const arr = Array.from(fileList);
    if (state.files.length + arr.length > 6) {
      toast('En fazla 6 görsel yükleyebilirsiniz.', 'error');
      return;
    }
    for (const f of arr) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
        toast(`Desteklenmeyen tür: ${f.name}`, 'error');
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast(`Dosya çok büyük (max 10MB): ${f.name}`, 'error');
        continue;
      }
      const dataUrl = await compressImage(f);
      state.files.push({ name: f.name, dataUrl, size: f.size });
    }
    renderFilePreview();
    $('#analyzeBtn').disabled = state.files.length === 0;
  }

  function compressImage(file, maxSide = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
          const w = Math.round(img.width * ratio);
          const h = Math.round(img.height * ratio);
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderFilePreview() {
    const fp = $('#filePreview');
    fp.innerHTML = '';
    state.files.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'fp-item';
      item.innerHTML = `
        <img src="${f.dataUrl}" alt="${escapeHtml(f.name)}" />
        <button class="fp-remove" title="Kaldır">×</button>
      `;
      item.querySelector('.fp-remove').addEventListener('click', () => {
        state.files.splice(i, 1);
        renderFilePreview();
        $('#analyzeBtn').disabled = state.files.length === 0;
      });
      fp.appendChild(item);
    });
  }

  function clearAnalysis() {
    state.files = [];
    state.lastResult = null;
    renderFilePreview();
    $('#analyzeBtn').disabled = true;
    $('#extraNotes').value = '';
    $('#resultEmpty').hidden = false;
    $('#resultBox').hidden = true;
    $('#resultLoading').hidden = true;
  }

  async function runAnalysis() {
    const { providerId, apiKey } = Settings.getActiveApiKey();
    if (!apiKey) {
      toast('Aktif sağlayıcı için API anahtarı tanımlı değil. Ayarlar sekmesine gidin.', 'error');
      return;
    }
    const provider = AIProviders.get(providerId);
    if (!provider) {
      toast('Sağlayıcı bulunamadı.', 'error');
      return;
    }

    $('#resultEmpty').hidden = true;
    $('#resultBox').hidden = true;
    $('#resultLoading').hidden = false;
    $('#loadingText').textContent = `${provider.label} analiz ediyor…`;
    $('#analyzeBtn').disabled = true;

    try {
      const dataUrls = state.files.map(f => f.dataUrl);
      const notes = $('#extraNotes').value;
      const aiResult = await provider.analyze(apiKey, dataUrls, notes);

      // ZORUNLU: kusur oranı veritabanından
      const scenario = TRAMER_SCENARIOS.find(s => s.id === aiResult.senaryoId);
      if (!scenario) throw new Error(`Senaryo #${aiResult.senaryoId} veritabanında yok.`);

      state.lastResult = {
        scenario,
        ai: aiResult,
        provider: provider.id,
        providerLabel: provider.label,
        analyzedAt: new Date().toISOString(),
      };
      renderResult(state.lastResult);
    } catch (e) {
      $('#resultLoading').hidden = true;
      $('#resultEmpty').hidden = false;
      toast('Analiz hatası: ' + e.message, 'error');
    } finally {
      $('#analyzeBtn').disabled = state.files.length === 0;
    }
  }

  function renderResult(r) {
    $('#resultLoading').hidden = true;
    $('#resultBox').hidden = false;

    $('#resScenarioTag').textContent = `Senaryo #${r.scenario.id} · Güven %${Math.round(r.ai.guvenSkoru * 100)}`;
    $('#resScenarioTitle').textContent = r.scenario.title;
    $('#resScenarioCat').textContent = r.scenario.category + ' · ' + r.providerLabel;
    $('#resFaultA').textContent = `%${r.scenario.faultA}`;
    $('#resFaultB').textContent = `%${r.scenario.faultB}`;
    $('#resReason').textContent = r.ai.gerekce;
    $('#resBeyanA').textContent = r.ai.beyanA;
    $('#resBeyanB').textContent = r.ai.beyanB;
    $('#resScenarioDesc').textContent = r.scenario.desc;
    $('#resLawRef').textContent = 'Yasal Dayanak: ' + (r.scenario.lawRef || '-');

    const ulIhlal = $('#resIhlaller');
    ulIhlal.innerHTML = '';
    (r.ai.ihlaller || []).forEach(x => {
      const li = document.createElement('li');
      li.textContent = '• ' + x;
      ulIhlal.appendChild(li);
    });
    if (!r.ai.ihlaller?.length) ulIhlal.innerHTML = '<li class="muted">Belirtilmemiş</li>';
  }

  function exportCurrent(type) {
    if (!state.lastResult) return;
    const rec = toExportRecord(state.lastResult);
    if (type === 'pdf') Exports.toPdf(rec);
    else Exports.toXlsxSingle(rec);
  }

  function toExportRecord(r, savedAt) {
    return {
      savedAt: savedAt || r.analyzedAt,
      scenarioId: r.scenario.id,
      scenarioTitle: r.scenario.title,
      scenarioCategory: r.scenario.category,
      scenarioDesc: r.scenario.desc,
      lawRef: r.scenario.lawRef,
      faultA: r.scenario.faultA,
      faultB: r.scenario.faultB,
      plateA: '—',
      driverA: '—',
      insurerA: '',
      plateB: '—',
      driverB: '—',
      insurerB: '',
      accidentDate: r.analyzedAt,
      accidentLocation: '',
      notes: 'AI: ' + r.ai.gerekce + ' | Sağlayıcı: ' + r.providerLabel,
    };
  }

  // ============ GEÇMİŞ ============
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') || []; }
    catch (e) { return []; }
  }

  function saveHistory(arr) {
    if (arr.length > 100) arr.length = 100;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  }

  function saveCurrentResult() {
    if (!state.lastResult) return;
    const all = loadHistory();
    const item = {
      id: 'h_' + Date.now().toString(36),
      ...state.lastResult,
    };
    all.unshift(item);
    saveHistory(all);
    toast('Geçmişe kaydedildi.', 'success');
  }

  function initHistoryTab() {
    $('#btnExportAllAi').addEventListener('click', () => {
      const all = loadHistory();
      if (all.length === 0) return toast('Aktarılacak kayıt yok.', 'error');
      Exports.toXlsxAll(all.map(toExportRecord));
    });
    $('#btnClearAi').addEventListener('click', () => {
      if (!confirm('Tüm AI analiz geçmişi silinecek. Emin misiniz?')) return;
      saveHistory([]);
      renderHistory();
    });
  }

  function renderHistory() {
    const all = loadHistory();
    const body = $('#historyBody');
    const empty = $('#historyEmpty');
    body.innerHTML = '';

    if (!all.length) {
      empty.style.display = 'block';
      $('#historyTable').style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    $('#historyTable').style.display = '';

    all.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(formatDate(r.analyzedAt))}</td>
        <td>#${r.scenario.id} ${escapeHtml(r.scenario.title)}</td>
        <td>%${r.scenario.faultA}</td>
        <td>%${r.scenario.faultB}</td>
        <td>${escapeHtml(r.providerLabel)}</td>
        <td class="row-actions">
          <button class="btn-ghost" data-act="pdf" data-i="${i}">PDF</button>
          <button class="btn-ghost" data-act="xlsx" data-i="${i}">Excel</button>
          <button class="btn-danger" data-act="del" data-i="${i}">Sil</button>
        </td>
      `;
      body.appendChild(tr);
    });

    body.querySelectorAll('button[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        const i = parseInt(btn.dataset.i, 10);
        const all = loadHistory();
        const r = all[i];
        if (!r) return;
        if (act === 'pdf') Exports.toPdf(toExportRecord(r));
        else if (act === 'xlsx') Exports.toXlsxSingle(toExportRecord(r));
        else if (act === 'del') {
          if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
          all.splice(i, 1);
          saveHistory(all);
          renderHistory();
        }
      });
    });
  }

  // ============ Yardımcılar ============
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('tr-TR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (e) { return iso; }
  }

  function toast(msg, type = 'info') {
    const c = $('#toastContainer');
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; }, 3000);
    setTimeout(() => t.remove(), 3400);
  }

})();
