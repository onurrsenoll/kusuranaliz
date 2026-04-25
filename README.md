# Kaza Kusur Analiz Robotu

TRAMER (Trafik Sigortaları Bilgi Merkezi) tarafından yayımlanan **48 standart kaza senaryosuna** dayalı, tarayıcı üzerinde çalışan kusur oranı analiz aracı.

İki kullanım modu:

| Mod | URL | Açıklama |
|-----|-----|----------|
| **Klasik** (manuel) | `index.html` | Senaryoyu kendiniz seçer, plaka/sürücü doldurursunuz |
| **AI** (otomatik) | `ai.html` | Tutanak fotoğrafını yükler, yapay zekâ TRAMER 48 senaryosundan birini otomatik eşler |

> **AI modu önemli not:** Yapay zekâ yalnızca olayı en uygun senaryoya **eşler**. Kusur oranı her zaman senaryo veritabanından alınır — AI **tahmin yürütmez**, **yüzde uydurmaz**.

## Özellikler

### Klasik mod (`index.html`)
- 48 TRAMER senaryosu, kategori filtresi ve arama
- A/B aracı plaka, sürücü, sigorta bilgileri ile manuel form
- PDF + Excel raporu
- localStorage'da son 100 analiz

### AI mod (`ai.html`)
- **Şifreli giriş** (tek kullanıcı, SHA-256 hash, 8 saat oturum)
- **Çoklu sağlayıcı:** Google Gemini, OpenAI, Anthropic Claude
- **Test Et** butonu — her API anahtarının çalışıp çalışmadığı anında doğrulanır
- **Tutanak yükleme:** drag & drop, çoklu görsel, otomatik sıkıştırma
- **TRAMER zorunlu:** AI 1-48 arası senaryo numarası seçer; kusur oranı veritabanından gelir
- **Modern tema:** glassmorphism, animasyonlu arka plan, koyu/açık mod

## Kurulum

```bash
git clone https://github.com/onurrsenoll/kusuranaliz.git
cd kusuranaliz
python3 -m http.server 8080
# Klasik:  http://localhost:8080/
# AI:      http://localhost:8080/ai.html
```

Veya GitHub Pages: <https://onurrsenoll.github.io/kusuranaliz/>

## AI Modu — İlk Kurulum

1. `ai.html` aç → Parola belirle (en az 6 karakter)
2. **Ayarlar** sekmesine geç
3. Kullanmak istediğin sağlayıcıdan API anahtarı al ve gir:
   - Gemini: <https://aistudio.google.com/app/apikey>
   - OpenAI: <https://platform.openai.com/api-keys>
   - Anthropic: <https://console.anthropic.com/settings/keys>
4. **Test Et** ile bağlantıyı doğrula → ✓ ÇALIŞIYOR rozeti görmelisin
5. **Aktif Sağlayıcı**'yı seç → **Kaydet**
6. **Yeni Analiz** sekmesinde tutanak görselini yükle → 🤖 Analiz Et

## Proje Yapısı

```
kusuranaliz/
├── index.html              # Klasik manuel sürüm
├── ai.html                 # AI destekli sürüm
├── css/
│   ├── style.css           # Klasik tema
│   └── ai.css              # AI glassmorphism teması
└── js/
    ├── scenarios.js        # 48 TRAMER senaryosu (her iki sürüm de kullanır)
    ├── exports.js          # PDF + Excel (her ikisi)
    ├── app.js              # Klasik sürüm UI
    ├── history.js          # Klasik sürüm geçmiş
    ├── auth.js             # AI: parola + oturum
    ├── settings.js         # AI: API anahtar yönetimi
    ├── ai-providers.js     # AI: Gemini/OpenAI/Claude adaptörleri
    └── ai-app.js           # AI: ana uygulama mantığı
```

## Kullanılan Kütüphaneler

| Kütüphane | Amaç                | Lisans |
|-----------|---------------------|--------|
| jsPDF     | PDF üretimi         | MIT    |
| SheetJS   | Excel dışa aktarımı | Apache 2.0 |

Kütüphaneler CDN üzerinden yüklenir; herhangi bir build aracına gerek yoktur.

## Güvenlik

- **API anahtarları yalnızca kendi tarayıcınızda** (`localStorage`) saklanır; sunucuya gönderilmez.
- **Parola SHA-256 hash** olarak saklanır; düz metin tutulmaz.
- **Görseller sunucuya yüklenmez** — yalnızca seçtiğiniz AI sağlayıcısının API'sine gönderilir.

> Bu, sunucusuz statik bir uygulamadır; aynı tarayıcıyı paylaşan birinin geliştirici araçlarına erişimine karşı güvenlik sağlamaz. Kişisel cihazınızda kullanın.

## Lisans

MIT
