/**
 * Yapay zekâ sağlayıcı adaptörleri.
 *
 * 3 sağlayıcı için tek tip API:
 *   - testKey(apiKey)            -> { ok, message }
 *   - analyze(apiKey, images, notes) -> { senaryoId, gerekce, ihlaller, beyanA, beyanB, olusSekli }
 *
 * KURAL: AI yalnızca TRAMER 48 senaryosundan birini (id: 1..48) seçer.
 * Kusur oranı veritabanından gelir; AI uydurmaz, tahmin etmez.
 */
const AIProviders = (() => {

  // === TRAMER kataloğu prompt’a sığacak şekilde özetlenir ===
  function buildScenarioCatalog() {
    return TRAMER_SCENARIOS.map(s =>
      `${s.id}. [${s.category}] ${s.title} — ${s.desc}`
    ).join('\n');
  }

  // === Tek tip system prompt ===
  function systemPrompt() {
    return `Sen, Türkiye TRAMER (Trafik Sigortaları Bilgi Merkezi) standartlarına göre çalışan bir kaza tutanağı analiz uzmanısın.

ÇOK ÖNEMLİ KURALLAR:
1. SADECE aşağıda listelenen 48 standart TRAMER senaryosundan BİRİNİ seçmek zorundasın. Liste dışı senaryo üretemezsin.
2. Kendi kafandan kusur yüzdesi UYDURMA. Kusur oranı senaryo veritabanından otomatik alınacaktır.
3. Eğer görseller / beyanlar yetersizse, en yakın senaryoyu seç ve düşük güven skoru belirt.
4. Yanıtı YALNIZCA aşağıdaki JSON formatında dön; başına/sonuna metin EKLEME.

ÇIKTI FORMATI (zorunlu):
{
  "senaryo_id": <1..48 arası tam sayı>,
  "guven_skoru": <0..1 arası ondalık>,
  "gerekce": "<seçim gerekçesi, 2-4 cümle, Türkçe>",
  "ihlaller": ["<ihlal 1>", "<ihlal 2>"],
  "beyan_a": "<A aracı/sürücü beyanının özeti>",
  "beyan_b": "<B aracı/sürücü beyanının özeti>",
  "olus_sekli": "<olayın oluş şekli, 1-2 cümle>"
}

48 TRAMER SENARYOSU:
${buildScenarioCatalog()}`;
  }

  function userPrompt(notes) {
    let p = 'Aşağıda kaza tutanağı ve/veya kaza yeri fotoğrafları yer alıyor. Görselleri incele ve KURALLARDA belirtilen JSON formatında yanıt ver.';
    if (notes && notes.trim()) {
      p += `\n\nKullanıcı notları:\n${notes.trim()}`;
    }
    p += '\n\nUNUTMA: Sadece 1-48 arası senaryo_id seç. Kusur yüzdesi yazma. Sadece JSON dön.';
    return p;
  }

  // === Yardımcı: dataURL'den base64 ve mime ayır ===
  function splitDataUrl(dataUrl) {
    const m = /^data:(image\/[a-zA-Z]+);base64,(.*)$/.exec(dataUrl);
    if (!m) throw new Error('Geçersiz görsel formatı (dataURL bekleniyor).');
    return { mime: m[1], base64: m[2] };
  }

  function tryParseJson(text) {
    if (!text) throw new Error('Boş yanıt.');
    // markdown fence varsa temizle
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    // ilk { ... } bloğunu bul
    const a = text.indexOf('{');
    const b = text.lastIndexOf('}');
    if (a < 0 || b < 0) throw new Error('Yanıtta JSON bulunamadı.');
    return JSON.parse(text.slice(a, b + 1));
  }

  function normalizeResult(raw) {
    const id = parseInt(raw.senaryo_id, 10);
    if (!(id >= 1 && id <= 48)) {
      throw new Error(`Geçersiz senaryo_id: ${raw.senaryo_id}`);
    }
    return {
      senaryoId: id,
      guvenSkoru: clamp(parseFloat(raw.guven_skoru) || 0.5, 0, 1),
      gerekce: String(raw.gerekce || '').trim() || '—',
      ihlaller: Array.isArray(raw.ihlaller) ? raw.ihlaller.map(String) : [],
      beyanA: String(raw.beyan_a || '—').trim(),
      beyanB: String(raw.beyan_b || '—').trim(),
      olusSekli: String(raw.olus_sekli || '—').trim(),
    };
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  // ===================== GEMINI =====================
  const Gemini = {
    id: 'gemini',
    label: 'Google Gemini 1.5 Flash',
    icon: 'G',
    placeholder: 'AIza... (Gemini API anahtarı)',
    docsUrl: 'https://aistudio.google.com/app/apikey',

    async testKey(apiKey) {
      if (!apiKey) return { ok: false, message: 'Anahtar boş.' };
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
          { method: 'GET' }
        );
        if (r.ok) {
          const j = await r.json();
          return { ok: true, message: `Bağlantı OK · ${(j.models || []).length} model erişilebilir.` };
        }
        const e = await r.json().catch(() => ({}));
        return { ok: false, message: e.error?.message || `HTTP ${r.status}` };
      } catch (e) {
        return { ok: false, message: 'Ağ hatası: ' + e.message };
      }
    },

    async analyze(apiKey, images, notes) {
      const parts = [
        { text: systemPrompt() + '\n\n' + userPrompt(notes) },
        ...images.map(d => {
          const { mime, base64 } = splitDataUrl(d);
          return { inline_data: { mime_type: mime, data: base64 } };
        }),
      ];
      const body = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: 'application/json',
          maxOutputTokens: 2048,
        },
      };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || `Gemini ${r.status}`);
      }
      const j = await r.json();
      const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
      return normalizeResult(tryParseJson(txt));
    },
  };

  // ===================== OPENAI =====================
  const OpenAI = {
    id: 'openai',
    label: 'OpenAI GPT-4o-mini',
    icon: 'O',
    placeholder: 'sk-... (OpenAI API anahtarı)',
    docsUrl: 'https://platform.openai.com/api-keys',

    async testKey(apiKey) {
      if (!apiKey) return { ok: false, message: 'Anahtar boş.' };
      try {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (r.ok) {
          const j = await r.json();
          return { ok: true, message: `Bağlantı OK · ${(j.data || []).length} model erişilebilir.` };
        }
        const e = await r.json().catch(() => ({}));
        return { ok: false, message: e.error?.message || `HTTP ${r.status}` };
      } catch (e) {
        return { ok: false, message: 'Ağ hatası: ' + e.message };
      }
    },

    async analyze(apiKey, images, notes) {
      const content = [
        { type: 'text', text: userPrompt(notes) },
        ...images.map(d => ({ type: 'image_url', image_url: { url: d } })),
      ];
      const body = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      };
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || `OpenAI ${r.status}`);
      }
      const j = await r.json();
      const txt = j.choices?.[0]?.message?.content || '';
      return normalizeResult(tryParseJson(txt));
    },
  };

  // ===================== ANTHROPIC =====================
  const Anthropic = {
    id: 'anthropic',
    label: 'Anthropic Claude 3.5 Haiku',
    icon: 'C',
    placeholder: 'sk-ant-... (Anthropic API anahtarı)',
    docsUrl: 'https://console.anthropic.com/settings/keys',

    _headers(apiKey) {
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    },

    async testKey(apiKey) {
      if (!apiKey) return { ok: false, message: 'Anahtar boş.' };
      try {
        // Çok küçük bir mesaj göndererek auth doğrulanır
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: this._headers(apiKey),
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        if (r.ok) return { ok: true, message: 'Bağlantı OK · Claude 3.5 Haiku erişilebilir.' };
        const e = await r.json().catch(() => ({}));
        return { ok: false, message: e.error?.message || `HTTP ${r.status}` };
      } catch (e) {
        return { ok: false, message: 'Ağ hatası: ' + e.message };
      }
    },

    async analyze(apiKey, images, notes) {
      const content = [
        ...images.map(d => {
          const { mime, base64 } = splitDataUrl(d);
          return {
            type: 'image',
            source: { type: 'base64', media_type: mime, data: base64 },
          };
        }),
        { type: 'text', text: userPrompt(notes) },
      ];
      const body = {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        temperature: 0.1,
        system: systemPrompt(),
        messages: [{ role: 'user', content }],
      };
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: this._headers(apiKey),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || `Anthropic ${r.status}`);
      }
      const j = await r.json();
      const txt = j.content?.map(c => c.text || '').join('') || '';
      return normalizeResult(tryParseJson(txt));
    },
  };

  // ===================== OPENROUTER =====================
  // Tek anahtar ile Claude, GPT, Gemini vb. modellere erişim sağlar.
  // Format: OpenAI uyumlu /chat/completions
  const OpenRouter = {
    id: 'openrouter',
    label: 'OpenRouter (Claude 3.5 Sonnet)',
    icon: 'R',
    placeholder: 'sk-or-v1-... (OpenRouter API anahtarı)',
    docsUrl: 'https://openrouter.ai/keys',
    _model: 'anthropic/claude-3.5-sonnet',

    async testKey(apiKey) {
      if (!apiKey) return { ok: false, message: 'Anahtar boş.' };
      try {
        const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (r.ok) {
          const j = await r.json();
          const usage = j.data?.usage;
          const limit = j.data?.limit;
          let msg = 'Bağlantı OK';
          if (typeof usage === 'number') {
            msg += ` · Kullanım: $${usage.toFixed(4)}`;
            if (typeof limit === 'number') msg += ` / $${limit.toFixed(2)}`;
          }
          msg += ` · Model: ${this._model}`;
          return { ok: true, message: msg };
        }
        const e = await r.json().catch(() => ({}));
        return { ok: false, message: e.error?.message || `HTTP ${r.status}` };
      } catch (e) {
        return { ok: false, message: 'Ağ hatası: ' + e.message };
      }
    },

    async analyze(apiKey, images, notes) {
      const content = [
        { type: 'text', text: userPrompt(notes) },
        ...images.map(d => ({ type: 'image_url', image_url: { url: d } })),
      ];
      const body = {
        model: this._model,
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      };
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': location.origin,
          'X-Title': 'TRAMER AI',
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error?.message || `OpenRouter ${r.status}`);
      }
      const j = await r.json();
      const txt = j.choices?.[0]?.message?.content || '';
      return normalizeResult(tryParseJson(txt));
    },
  };

  // ===================== Public =====================
  const all = {
    openrouter: OpenRouter,
    anthropic: Anthropic,
    gemini: Gemini,
    openai: OpenAI,
  };

  return {
    list: () => Object.values(all),
    get: id => all[id] || null,
  };
})();

if (typeof window !== 'undefined') window.AIProviders = AIProviders;
