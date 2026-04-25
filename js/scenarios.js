/**
 * TRAMER 48 Standart Kaza Senaryosu Veritabanı
 *
 * Kaynak: TRAMER / SBM kamuya açık kaza senaryoları (özetlenmiş halidir).
 * Kusur oranları örnek niteliğindedir; resmi tutanak değerlendirmesinde
 * sigorta eksperinin görüşü esas alınır.
 *
 * Her senaryo nesnesi:
 *  - id        : 1..48 arası benzersiz numara
 *  - category  : Kategori adı
 *  - title     : Senaryonun kısa adı
 *  - desc      : Detaylı açıklama (kazanın oluş şekli)
 *  - faultA    : A aracının kusur yüzdesi (0..100)
 *  - faultB    : B aracının kusur yüzdesi (0..100)
 *  - keywords  : Arama anahtar kelimeleri
 *  - lawRef    : İlgili Karayolları Trafik Kanunu maddesi
 */
const TRAMER_SCENARIOS = [
  // ===== Kategori: Arkadan Çarpma (1-6) =====
  {
    id: 1,
    category: 'Arkadan Çarpma',
    title: 'Aynı şeritte arkadan çarpma',
    desc: 'A aracı önde, B aracı arkada aynı şeritte seyrederken B aracı, takip mesafesini ihlal ederek A aracına arkadan çarpar.',
    faultA: 0, faultB: 100,
    keywords: ['arkadan', 'takip mesafesi', 'çarpma', 'aynı şerit'],
    lawRef: 'KTK md. 52, 84'
  },
  {
    id: 2,
    category: 'Arkadan Çarpma',
    title: 'Kırmızı ışıkta duran araca arkadan çarpma',
    desc: 'A aracı kırmızı ışıkta usulüne uygun durmuşken, arkasındaki B aracı çarpar.',
    faultA: 0, faultB: 100,
    keywords: ['kırmızı ışık', 'duran araç', 'arkadan'],
    lawRef: 'KTK md. 47, 84'
  },
  {
    id: 3,
    category: 'Arkadan Çarpma',
    title: 'Trafik sıkışıklığında arkadan çarpma',
    desc: 'Sıkışık trafikte yavaşlayan/duran A aracına arkasındaki B aracı çarpar.',
    faultA: 0, faultB: 100,
    keywords: ['trafik', 'sıkışık', 'yavaşlama', 'arkadan'],
    lawRef: 'KTK md. 52, 84'
  },
  {
    id: 4,
    category: 'Arkadan Çarpma',
    title: 'Zincirleme arkadan çarpma',
    desc: 'B aracı, A aracına arkadan çarpar; itme etkisiyle A aracı önündeki C aracına çarpar.',
    faultA: 0, faultB: 100,
    keywords: ['zincirleme', 'arkadan', 'itme'],
    lawRef: 'KTK md. 52, 84'
  },
  {
    id: 5,
    category: 'Arkadan Çarpma',
    title: 'Aniden fren yapan araca çarpma',
    desc: 'A aracı, geçerli bir sebep olmaksızın aniden fren yapar; arkasındaki B aracı çarpar. A aracında kusur paylaşımı olabilir.',
    faultA: 25, faultB: 75,
    keywords: ['ani fren', 'arkadan', 'sebepsiz fren'],
    lawRef: 'KTK md. 52, 53'
  },
  {
    id: 6,
    category: 'Arkadan Çarpma',
    title: 'Otoyolda emniyet şeridindeki araca çarpma',
    desc: 'Emniyet şeridinde duran/arızalı A aracına, ana şeritten emniyet şeridine giren B aracı çarpar.',
    faultA: 0, faultB: 100,
    keywords: ['emniyet şeridi', 'otoyol', 'arızalı'],
    lawRef: 'KTK md. 60, 61'
  },

  // ===== Kategori: Şerit Değiştirme (7-12) =====
  {
    id: 7,
    category: 'Şerit Değiştirme',
    title: 'Sağ şeritten sola şerit değiştirme',
    desc: 'A aracı sağ şeritte seyreden B aracını fark etmeden sol şeride geçer ve B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['şerit değiştirme', 'sola geçiş', 'sinyal'],
    lawRef: 'KTK md. 56'
  },
  {
    id: 8,
    category: 'Şerit Değiştirme',
    title: 'Sol şeritten sağa şerit değiştirme',
    desc: 'A aracı sol şeritten sağa geçerken sağ şeritteki B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['şerit değiştirme', 'sağa geçiş'],
    lawRef: 'KTK md. 56'
  },
  {
    id: 9,
    category: 'Şerit Değiştirme',
    title: 'Aynı anda şerit değiştirme (her iki araç da)',
    desc: 'A ve B araçları aynı anda komşu şeritlerinden orta şeride geçer ve çarpışır.',
    faultA: 50, faultB: 50,
    keywords: ['eş zamanlı şerit', 'orta şerit'],
    lawRef: 'KTK md. 56'
  },
  {
    id: 10,
    category: 'Şerit Değiştirme',
    title: 'Solladığı araca çarpma',
    desc: 'A aracı, sol şeride geçerek B aracını sollarken usule aykırı şekilde sağa dönerek B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['sollama', 'sola geçiş', 'kapatma'],
    lawRef: 'KTK md. 54'
  },
  {
    id: 11,
    category: 'Şerit Değiştirme',
    title: 'Hatalı sollama – ters yönden',
    desc: 'A aracı, kesik çizgi olmamasına rağmen ters yönden sollama yapar ve karşı yönden gelen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['ters yön', 'sollama', 'çizgi ihlali'],
    lawRef: 'KTK md. 46, 54'
  },
  {
    id: 12,
    category: 'Şerit Değiştirme',
    title: 'Şerit içinde kalmama',
    desc: 'A aracı şerit takip etmeden seyrederken yanındaki B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['şerit takibi', 'savrulma'],
    lawRef: 'KTK md. 56'
  },

  // ===== Kategori: Kavşak (13-22) =====
  {
    id: 13,
    category: 'Kavşak',
    title: 'Kontrolsüz kavşak – sağdan gelen araç hakkı',
    desc: 'Trafik ışığı veya levhası bulunmayan kavşakta soldan gelen A aracı, sağdan gelen B aracının geçiş üstünlüğünü ihlal eder.',
    faultA: 100, faultB: 0,
    keywords: ['kontrolsüz kavşak', 'sağdan gelen', 'geçiş üstünlüğü'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 14,
    category: 'Kavşak',
    title: 'Kırmızı ışıkta geçen araç',
    desc: 'A aracı kırmızı ışıkta kavşağa girer; yeşil ışıkla geçen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['kırmızı ışık ihlali', 'kavşak'],
    lawRef: 'KTK md. 47'
  },
  {
    id: 15,
    category: 'Kavşak',
    title: 'Sarı ışıkta giren araç ile yeşile yeni dönen araç',
    desc: 'A aracı sarı ışıkta kavşağa girerken, B aracı yeşille kavşağa giriş yapar; çarpışma olur.',
    faultA: 75, faultB: 25,
    keywords: ['sarı ışık', 'yeşil ışık', 'kavşak'],
    lawRef: 'KTK md. 47'
  },
  {
    id: 16,
    category: 'Kavşak',
    title: 'Dur levhası ihlali',
    desc: 'A aracı, "Dur" levhasını ihlal ederek ana yola çıkar ve B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['dur levhası', 'ana yol', 'tali yol'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 17,
    category: 'Kavşak',
    title: 'Yol ver levhası ihlali',
    desc: 'A aracı "Yol Ver" levhasına uymadan kavşağa girer ve B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['yol ver', 'kavşak', 'üstünlük'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 18,
    category: 'Kavşak',
    title: 'Sola dönüş yapan araca çarpma',
    desc: 'A aracı kavşakta sola dönerken karşıdan gelen düz seyreden B aracına yol vermez.',
    faultA: 100, faultB: 0,
    keywords: ['sola dönüş', 'karşıdan gelen', 'üstünlük'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 19,
    category: 'Kavşak',
    title: 'Sağa dönüş yapan araç ile aynı yönde seyreden araç',
    desc: 'A aracı sağa dönerken, sağ tarafından geçmek isteyen B motosikletine/aracına çarpar.',
    faultA: 75, faultB: 25,
    keywords: ['sağa dönüş', 'iç şerit', 'motosiklet'],
    lawRef: 'KTK md. 56, 57'
  },
  {
    id: 20,
    category: 'Kavşak',
    title: 'Dönel kavşağa giriş kuralı ihlali',
    desc: 'A aracı dönel kavşağa girerken, kavşak içinde dönmekte olan B aracına yol vermez.',
    faultA: 100, faultB: 0,
    keywords: ['dönel kavşak', 'göbek', 'yol vermeme'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 21,
    category: 'Kavşak',
    title: 'Dönel kavşaktan çıkışta şerit ihlali',
    desc: 'A aracı dönel kavşağın iç şeridindeyken sinyal vermeden dış şeride çıkar ve B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['dönel kavşak', 'çıkış', 'sinyal'],
    lawRef: 'KTK md. 56'
  },
  {
    id: 22,
    category: 'Kavşak',
    title: 'Çift yönde yeşil – sola dönüş çatışması',
    desc: 'Karşılıklı iki araç da yeşil ışıkta kavşağa girer; her iki araç da sola dönüş yapar ve çarpışır.',
    faultA: 50, faultB: 50,
    keywords: ['kavşak', 'sola dönüş', 'çift yön'],
    lawRef: 'KTK md. 57'
  },

  // ===== Kategori: Karşı Yönden Çarpışma (23-28) =====
  {
    id: 23,
    category: 'Karşı Yönden Çarpışma',
    title: 'Karşı şeride geçerek çarpışma',
    desc: 'A aracı karşı şeride geçer ve karşıdan gelen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['karşı şerit', 'kafa kafaya'],
    lawRef: 'KTK md. 46'
  },
  {
    id: 24,
    category: 'Karşı Yönden Çarpışma',
    title: 'Devamlı çizgide sollama',
    desc: 'A aracı devamlı çizgi olmasına rağmen sollama yaparak karşıdan gelen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['devamlı çizgi', 'sollama', 'şerit ihlali'],
    lawRef: 'KTK md. 46, 54'
  },
  {
    id: 25,
    category: 'Karşı Yönden Çarpışma',
    title: 'Virajda karşı şeride taşma',
    desc: 'A aracı virajda hız ihlali yaparak karşı şeride taşar ve B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['viraj', 'karşı şerit', 'hız'],
    lawRef: 'KTK md. 46, 51'
  },
  {
    id: 26,
    category: 'Karşı Yönden Çarpışma',
    title: 'İki yönlü yolda U dönüşü kazası',
    desc: 'A aracı U dönüşü yaparken karşı yönden gelen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['u dönüşü', 'manevra', 'karşı yön'],
    lawRef: 'KTK md. 67'
  },
  {
    id: 27,
    category: 'Karşı Yönden Çarpışma',
    title: 'Tepe noktasında sollama',
    desc: 'A aracı görüşün kısıtlı olduğu tepe noktasında sollama yapar ve karşıdan gelen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['tepe', 'sollama', 'görüş kısıtlı'],
    lawRef: 'KTK md. 54'
  },
  {
    id: 28,
    category: 'Karşı Yönden Çarpışma',
    title: 'Tek yönlü yolda ters yönde seyir',
    desc: 'A aracı tek yönlü yolda ters yönde seyrederken B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['tek yön', 'ters yön', 'ihlal'],
    lawRef: 'KTK md. 46'
  },

  // ===== Kategori: Park / Geri Manevra (29-36) =====
  {
    id: 29,
    category: 'Park / Geri Manevra',
    title: 'Park halindeki araca çarpma',
    desc: 'B aracı park halinde dururken hareket halindeki A aracı çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['park', 'duran araç'],
    lawRef: 'KTK md. 84'
  },
  {
    id: 30,
    category: 'Park / Geri Manevra',
    title: 'Hatalı parkın yol açtığı kaza',
    desc: 'B aracı park yasağı bulunan yere park etmiştir; geçen A aracı görüş kısıtlandığı için çarpar. Kusur paylaşımı.',
    faultA: 25, faultB: 75,
    keywords: ['hatalı park', 'park yasağı', 'görüş'],
    lawRef: 'KTK md. 61'
  },
  {
    id: 31,
    category: 'Park / Geri Manevra',
    title: 'Geri manevra ile hareket halindeki araca çarpma',
    desc: 'A aracı park yerinden geri çıkarken yoldan geçen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['geri manevra', 'park çıkışı'],
    lawRef: 'KTK md. 67'
  },
  {
    id: 32,
    category: 'Park / Geri Manevra',
    title: 'İki aracın aynı anda park yerinden çıkması',
    desc: 'A ve B araçları karşılıklı park yerlerinden aynı anda geri çıkarken çarpışır.',
    faultA: 50, faultB: 50,
    keywords: ['eş zamanlı', 'park', 'geri'],
    lawRef: 'KTK md. 67'
  },
  {
    id: 33,
    category: 'Park / Geri Manevra',
    title: 'Yol kenarına park ederken arkadan gelen araca çarpma',
    desc: 'A aracı park için sağa yanaşırken sağ taraftan gelen B motosikletine çarpar.',
    faultA: 75, faultB: 25,
    keywords: ['park', 'sağa yanaşma', 'motosiklet'],
    lawRef: 'KTK md. 56'
  },
  {
    id: 34,
    category: 'Park / Geri Manevra',
    title: 'Garaj/AVM otoparkından çıkışta yola çarpma',
    desc: 'A aracı kapalı otoparktan/garajdan çıkarken kaldırımdan/yoldan geçen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['otopark', 'garaj çıkışı', 'yol'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 35,
    category: 'Park / Geri Manevra',
    title: 'İki sıra parkta kapı açma',
    desc: 'B aracı park halindeyken kapısını aniden açar; geçen A aracı çarpar.',
    faultA: 25, faultB: 75,
    keywords: ['kapı açma', 'park', 'aniden'],
    lawRef: 'KTK md. 67'
  },
  {
    id: 36,
    category: 'Park / Geri Manevra',
    title: 'Geri manevrada karşılıklı park yerine giren iki araç',
    desc: 'A ve B araçları aynı anda aynı park yerine girmeye çalışır; çarpışırlar.',
    faultA: 50, faultB: 50,
    keywords: ['park', 'eş zamanlı', 'manevra'],
    lawRef: 'KTK md. 67'
  },

  // ===== Kategori: Yan Yol / Çıkış (37-42) =====
  {
    id: 37,
    category: 'Yan Yol / Çıkış',
    title: 'Tali yoldan ana yola çıkışta çarpışma',
    desc: 'A aracı tali yoldan ana yola çıkarken ana yoldaki B aracına yol vermez.',
    faultA: 100, faultB: 0,
    keywords: ['tali yol', 'ana yol', 'çıkış'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 38,
    category: 'Yan Yol / Çıkış',
    title: 'Akaryakıt istasyonundan çıkış',
    desc: 'A aracı akaryakıt istasyonundan/işyerinden yola çıkarken yoldan geçen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['benzin istasyonu', 'çıkış', 'yola dahil'],
    lawRef: 'KTK md. 57'
  },
  {
    id: 39,
    category: 'Yan Yol / Çıkış',
    title: 'Otoyol giriş rampasından gelen araç',
    desc: 'A aracı otoyol giriş rampasından sağ şeride katılırken, sağ şeritteki B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['otoyol', 'rampa', 'katılım'],
    lawRef: 'KTK md. 56, 57'
  },
  {
    id: 40,
    category: 'Yan Yol / Çıkış',
    title: 'Otoyol çıkış rampasında ani şerit değişimi',
    desc: 'A aracı son anda çıkış rampasına yönelmek için sağa keskin manevra yapar ve sağ şeritteki B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['çıkış rampası', 'ani manevra'],
    lawRef: 'KTK md. 56'
  },
  {
    id: 41,
    category: 'Yan Yol / Çıkış',
    title: 'Refüj geçişi sırasında karşıdan gelen araca çarpma',
    desc: 'A aracı refüj boşluğundan U dönüşü yaparken karşıdan gelen B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['refüj', 'u dönüşü', 'karşı yön'],
    lawRef: 'KTK md. 67'
  },
  {
    id: 42,
    category: 'Yan Yol / Çıkış',
    title: 'Park yerinden çıkışta öncelik ihlali',
    desc: 'A aracı park alanından çıkarken yola devam etmekte olan B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['park çıkışı', 'öncelik'],
    lawRef: 'KTK md. 57'
  },

  // ===== Kategori: Özel Durumlar (43-48) =====
  {
    id: 43,
    category: 'Özel Durumlar',
    title: 'Yaya geçidinde yayaya çarpma',
    desc: 'A aracı, yaya geçidinde geçmekte olan yayaya çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['yaya geçidi', 'yaya', 'üstünlük'],
    lawRef: 'KTK md. 74'
  },
  {
    id: 44,
    category: 'Özel Durumlar',
    title: 'Demiryolu hemzemin geçidinde çarpışma',
    desc: 'A aracı, hemzemin geçit kurallarını ihlal ederek geçit üzerinde durur; trene/B aracına çarpılır.',
    faultA: 100, faultB: 0,
    keywords: ['hemzemin', 'demiryolu', 'tren'],
    lawRef: 'KTK md. 58'
  },
  {
    id: 45,
    category: 'Özel Durumlar',
    title: 'Hız ihlali ile çarpışma',
    desc: 'A aracı azami hız sınırını önemli ölçüde aşarak seyreder ve normal seyirdeki B aracına çarpar.',
    faultA: 100, faultB: 0,
    keywords: ['hız ihlali', 'aşırı hız'],
    lawRef: 'KTK md. 51'
  },
  {
    id: 46,
    category: 'Özel Durumlar',
    title: 'Alkol/uyuşturucu etkisi altında sürüş',
    desc: 'A aracı alkollü/uyuşturucu etkisi altında seyrederken kazaya neden olur.',
    faultA: 100, faultB: 0,
    keywords: ['alkol', 'uyuşturucu', 'ehliyet'],
    lawRef: 'KTK md. 48'
  },
  {
    id: 47,
    category: 'Özel Durumlar',
    title: 'Acil durum aracına yol vermeme',
    desc: 'A aracı, sireni çalan ambulans/itfaiye/polis aracına yol vermez ve B aracı (acil) ile çarpışır.',
    faultA: 100, faultB: 0,
    keywords: ['ambulans', 'itfaiye', 'siren', 'yol vermeme'],
    lawRef: 'KTK md. 71'
  },
  {
    id: 48,
    category: 'Özel Durumlar',
    title: 'Hayvan/cisim çarpması sonrası ikincil kaza',
    desc: 'A aracı yola fırlayan hayvan/cisim sebebiyle ani manevra yapar; B aracına çarpar. Mücbir sebep değerlendirmesine göre kusur paylaşımı.',
    faultA: 50, faultB: 50,
    keywords: ['hayvan', 'mücbir sebep', 'ani manevra'],
    lawRef: 'KTK md. 52'
  }
];

// Tüm benzersiz kategoriler
const TRAMER_CATEGORIES = [...new Set(TRAMER_SCENARIOS.map(s => s.category))];

if (typeof module !== 'undefined') {
  module.exports = { TRAMER_SCENARIOS, TRAMER_CATEGORIES };
}
