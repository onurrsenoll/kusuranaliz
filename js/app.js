/**
 * Kaza Kusur Analiz Robotu v3 - UI mantığı
 * Bağımlılıklar: scenarios.js, history.js, exports.js
 */
(function () {
  'use strict';

  // ============ Global durum ============
  const state = {
    selectedScenario: null,
    currentResult: null, // analiz formu doldurulup hesaplandığında oluşur
  };

  // ============ DOM kısayolları ============
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  // ============ Başlatma ============
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSidebar();
    initForm();
    initResultActions();
    initHistoryTab();
    setDefaultDate();
  });

  // ============ Sekme yönetimi ============
  function initTabs() {
    $$('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        $$('.tab').forEach(b => b.classList.toggle('active', b === btn));
        $$('.tab-panel').forEach(p => {
          p.classList.toggle('active', p.id === `tab-${target}`);
        });
        if (target === 'history') renderHistory();
      });
    });
  }

  // ============ Sol panel: senaryo listesi ============
  function initSidebar() {
    // Kategori dropdown'unu doldur
    const sel = $('#categoryFilter');
    TRAMER_CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', renderScenarioList);
    $('#searchBox').addEventListener('input', renderScenarioList);

    renderScenarioList();
  }

  function renderScenarioList() {
    const search = ($('#searchBox').value || '').toLowerCase().trim();
    const cat = $('#categoryFilter').value;
    const list = $('#scenarioList');
    list.innerHTML = '';

    const filtered = TRAMER_SCENARIOS.filter(s => {
      if (cat && s.category !== cat) return false;
      if (!search) return true;
      const haystack = [
        s.title, s.category, s.desc,
        ...(s.keywords || [])
      ].join(' ').toLowerCase();
      return haystack.includes(search);
    });

    if (filtered.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Sonuç bulunamadı.';
      li.style.cursor = 'default';
      li.style.color = 'var(--muted)';
      list.appendChild(li);
      return;
    }

    filtered.forEach(s => {
      const li = document.createElement('li');
      li.dataset.id = s.id;
      li.innerHTML = `<span class="id">#${s.id}</span>${escapeHtml(s.title)}` +
        `<span class="cat-tag">${escapeHtml(s.category)}</span>`;
      if (state.selectedScenario && state.selectedScenario.id === s.id) {
        li.classList.add('selected');
      }
      li.addEventListener('click', () => selectScenario(s));
      list.appendChild(li);
    });
  }

  function selectScenario(scenario) {
    state.selectedScenario = scenario;
    $$('#scenarioList li').forEach(li => {
      li.classList.toggle('selected', Number(li.dataset.id) === scenario.id);
    });
    renderScenarioDetail(scenario);
    $('#analyzeForm').hidden = false;
    $('#resultBox').hidden = true;
    state.currentResult = null;
  }

  function renderScenarioDetail(s) {
    const box = $('#scenarioDetail');
    box.classList.remove('empty');
    box.innerHTML = `
      <h3>#${s.id} — ${escapeHtml(s.title)}</h3>
      <div class="meta">
        <span>${escapeHtml(s.category)}</span>
        <span>${escapeHtml(s.lawRef || 'KTK')}</span>
      </div>
      <p class="desc">${escapeHtml(s.desc)}</p>
      <div class="preview">
        <div class="pcard a">
          <div>A Aracı (önceden tanımlı)</div>
          <div class="pct">%${s.faultA}</div>
        </div>
        <div class="pcard b">
          <div>B Aracı (önceden tanımlı)</div>
          <div class="pct">%${s.faultB}</div>
        </div>
      </div>
    `;
  }

  // ============ Form ============
  function initForm() {
    const form = $('#analyzeForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!state.selectedScenario) {
        alert('Lütfen önce bir senaryo seçin.');
        return;
      }
      const r = collectFormData();
      state.currentResult = r;
      renderResult(r);
    });

    form.addEventListener('reset', () => {
      $('#resultBox').hidden = true;
      state.currentResult = null;
      setDefaultDate();
    });
  }

  function collectFormData() {
    const s = state.selectedScenario;
    return {
      scenarioId: s.id,
      scenarioTitle: s.title,
      scenarioCategory: s.category,
      scenarioDesc: s.desc,
      lawRef: s.lawRef || '',
      faultA: s.faultA,
      faultB: s.faultB,
      plateA: $('#plateA').value.trim(),
      driverA: $('#driverA').value.trim(),
      insurerA: $('#insurerA').value.trim(),
      plateB: $('#plateB').value.trim(),
      driverB: $('#driverB').value.trim(),
      insurerB: $('#insurerB').value.trim(),
      accidentDate: $('#accidentDate').value,
      accidentLocation: $('#accidentLocation').value.trim(),
      notes: $('#notes').value.trim(),
    };
  }

  function renderResult(r) {
    $('#resPlateA').textContent = r.plateA;
    $('#resPlateB').textContent = r.plateB;
    $('#resFaultA').textContent = `%${r.faultA}`;
    $('#resFaultB').textContent = `%${r.faultB}`;
    $('#resLawRef').textContent = r.lawRef
      ? `Yasal Dayanak: ${r.lawRef}`
      : '';
    $('#resultBox').hidden = false;
    $('#resultBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ============ Sonuç işlemleri (PDF/Excel/Geçmiş) ============
  function initResultActions() {
    $('#btnExportPdf').addEventListener('click', () => {
      if (!state.currentResult) return;
      // savedAt yoksa anlık üret
      const rec = { savedAt: new Date().toISOString(), ...state.currentResult };
      Exports.toPdf(rec);
    });

    $('#btnExportXlsx').addEventListener('click', () => {
      if (!state.currentResult) return;
      const rec = { savedAt: new Date().toISOString(), ...state.currentResult };
      Exports.toXlsxSingle(rec);
    });

    $('#btnSaveHistory').addEventListener('click', () => {
      if (!state.currentResult) return;
      const saved = History.add(state.currentResult);
      flashMessage(`Geçmişe kaydedildi (#${saved.id.slice(-6)}).`);
    });
  }

  // ============ Geçmiş sekmesi ============
  function initHistoryTab() {
    $('#btnExportAllXlsx').addEventListener('click', () => {
      Exports.toXlsxAll(History.list());
    });
    $('#btnClearHistory').addEventListener('click', () => {
      if (!confirm('Tüm geçmiş silinecek. Emin misiniz?')) return;
      History.clear();
      renderHistory();
    });
  }

  function renderHistory() {
    const tbody = $('#historyTbody');
    const empty = $('#historyEmpty');
    const all = History.list();
    tbody.innerHTML = '';

    if (all.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    all.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(formatDate(r.savedAt))}</td>
        <td>#${r.scenarioId} ${escapeHtml(r.scenarioTitle)}</td>
        <td>${escapeHtml(r.plateA)}</td>
        <td>${escapeHtml(r.plateB)}</td>
        <td>%${r.faultA}</td>
        <td>%${r.faultB}</td>
        <td class="row-actions">
          <button class="primary" data-act="pdf" data-id="${r.id}">PDF</button>
          <button class="ghost"  data-act="xlsx" data-id="${r.id}">Excel</button>
          <button class="danger" data-act="del" data-id="${r.id}">Sil</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        const rec = History.get(id);
        if (!rec) return;
        if (act === 'pdf') Exports.toPdf(rec);
        else if (act === 'xlsx') Exports.toXlsxSingle(rec);
        else if (act === 'del') {
          if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            History.remove(id);
            renderHistory();
          }
        }
      });
    });
  }

  // ============ Yardımcılar ============
  function setDefaultDate() {
    const inp = $('#accidentDate');
    if (!inp.value) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      inp.value = now.toISOString().slice(0, 16);
    }
  }

  function formatDate(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('tr-TR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return iso; }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function flashMessage(msg) {
    const div = document.createElement('div');
    div.textContent = msg;
    Object.assign(div.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: '#16a34a',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      fontSize: '14px',
      transition: 'opacity 0.3s',
    });
    document.body.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; }, 2000);
    setTimeout(() => div.remove(), 2400);
  }

})();
