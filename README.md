# Kaza Kusur Analiz Robotu v3

TRAMER (Trafik Sigortaları Bilgi Merkezi) tarafından yayımlanan **48 standart kaza senaryosuna** dayalı, tarayıcı üzerinde çalışan kusur oranı analiz aracı.

> Eğitim ve ön değerlendirme amaçlıdır. Resmî bir tespit veya hukuki delil yerine geçmez. Bağlayıcı kusur oranı için sigorta şirketinizin / SBM'nin tutanak değerlendirmesi esas alınır.

## Özellikler

- **48 TRAMER senaryosu** — kategorilere ayrılmış, çizimli açıklamalı veritabanı
- **Akıllı arama** — senaryo başlığı, kategori veya anahtar kelime ile filtreleme
- **Otomatik kusur dağılımı** — A/B aracı için yüzdelik kusur hesabı
- **PDF raporu** — tek tıkla yazdırılabilir tutanak çıktısı (jsPDF)
- **Excel dışa aktarım** — geçmiş kayıtların `.xlsx` olarak indirilmesi (SheetJS)
- **Geçmiş** — `localStorage` üzerinde son 100 analizin saklanması ve geri yüklenmesi
- **Sıfır backend** — herhangi bir statik sunucuda (GitHub Pages dahil) çalışır

## Kurulum

```bash
git clone https://github.com/onurrsenoll/kusuranaliz.git
cd kusuranaliz
# Herhangi bir statik sunucuyla aç:
python3 -m http.server 8080
# veya doğrudan index.html dosyasını tarayıcıda aç
```

## Kullanım

1. Sol panelde TRAMER kategorisini seçin veya arama kutusuna yazın.
2. Kazanıza en yakın senaryoyu seçin; sağ panelde detaylar açılır.
3. Plaka, sürücü ve kaza tarihi bilgilerini doldurun.
4. **Analiz Et** ile kusur oranını hesaplayın.
5. **PDF İndir** veya **Excel İndir** ile raporu kaydedin.
6. **Geçmiş** sekmesinden önceki analizlerinize ulaşın.

## Proje Yapısı

```
kusuranaliz/
├── index.html              # Ana SPA dosyası
├── css/
│   └── style.css           # Stil
├── js/
│   ├── scenarios.js        # 48 TRAMER senaryosunun veritabanı
│   ├── app.js              # UI ve uygulama mantığı
│   ├── exports.js          # PDF + Excel dışa aktarım
│   └── history.js          # localStorage geçmiş yöneticisi
└── README.md
```

## Kullanılan Kütüphaneler

| Kütüphane | Amaç                | Lisans |
|-----------|---------------------|--------|
| jsPDF     | PDF üretimi         | MIT    |
| SheetJS   | Excel dışa aktarımı | Apache 2.0 |

Kütüphaneler CDN üzerinden yüklenir; ek bir paket yöneticisine ihtiyaç yoktur.

## Lisans

MIT
