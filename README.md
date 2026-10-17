# VocabBuilder

Türkçe arayüzlü İngilizce–Türkçe kelime öğrenme uygulaması. Kişisel sözlüğünü oluştur, diğer öğrencilerin kelimelerini keşfet ve iki yönlü çeviri alıştırmalarıyla ilerlemeni takip et.

**Canlı uygulama:** [vocabbuilder-yasin-kr.web.app](https://vocabbuilder-yasin-kr.web.app)

## Yerel çalıştırma

Node.js 20.19+ veya 22.12+ gerekir.

```sh
npm install
npm run dev
```

Uygulama **http://127.0.0.1:5173** adresinde çalışır. Port doluysa Vite başka porta sessizce geçmez. Windows PowerShell yürütme politikası `npm` betiğini engelliyorsa `npm.cmd` kullanın.

Kayıt veya giriş ekranındaki **Demoyu dene**, İngilizce–Türkçe örnek kelimelerle ayrı bir yerel çalışma alanı açar. Kelime ekleme, düzenleme, silme, öneriler, filtreler ve alıştırmalar çalışır; demo değişiklikleri yalnız kullanılan tarayıcıda saklanır. Demo gerçek bir kullanıcı hesabı oluşturmaz. Çıkış yapıldıktan sonra demo yeniden açılınca önceki demo ilerlemesi korunur.

Türkçe demo kayıtları `vocabbuilder.demo.words.en-tr.v1` anahtarında tutulur. Önceki İngilizce–Ukraynaca demo kayıtları silinmez veya Türkçe olarak yeniden etiketlenmez; ayrı tutulur.

## Teknolojiler

- React 19, TypeScript ve Vite
- React Router ile genel ve korumalı rotalar
- Redux Toolkit ile kategori deposu
- React Hook Form ve Yup ile gönderim sırasında form doğrulama
- TanStack Table ile tekrar kullanılabilir kelime tablosu
- Firebase Authentication ve Cloud Firestore
- Vitest ile doğrulama/öğrenme mantığı, Playwright ile tarayıcı akışları
- Yerelde sunulan Manrope değişken fontu; `@font-face`, SVG sprite ve favicon

## Ekranlar ve davranışlar

| Rota          | İçerik                                              |
| ------------- | --------------------------------------------------- |
| `/register`   | İsim, e-posta ve şifre ile kayıt                    |
| `/login`      | Giriş, şifre görünürlüğü ve alan hataları           |
| `/dictionary` | Kişisel kelimeler, ekleme/düzenleme/silme, ilerleme |
| `/recommend`  | Diğer öğrencilerin kelimeleri ve sözlüğe ekleme     |
| `/training`   | Çift yönlü çeviri görevleri, kaydetme ve sonuçlar   |

Arama 300 ms debounce ile çalışır ve baştaki/sondaki boşlukları temizler. Kategori filtresi, fiiller için düzenli/düzensiz seçimi ve sunucuda sayfalama desteklenir. Modallar kapatma düğmesi, İptal, Escape ve arka plana tıklama ile kapanır; doğal `dialog` odağı içeride tutar. Hatalı isteklerde girilmiş form değerleri korunur ve bildirim gösterilir.

Alıştırmalarda boş bırakılan cevaplar gönderilmez. İlerleme yanıtlanan görevlerin toplam görevlere oranıdır. Firebase/demo öğrenme puanı doğru cevapta 25 artar, yanlış cevapta 10 azalır ve 0–100 arasında tutulur. Tam öğrenilmiş kelimeler alıştırmalardan çıkarılır. Arama ve cevap kontrolü dile uygun büyük/küçük harf dönüşümü kullanır: Türkçede `I/ı` ve `İ/i`, İngilizcede `I/i` eşleşir.

Büyük sözlüklerde görevler en fazla 450 kelimelik alıştırmalara ayrılır. Her alıştırma ayrı kaydedilir; sonuç ekranındaki **Sonraki alıştırma** düğmesiyle kalan görevlere devam edilir. Erken kaydetmede yalnız mevcut alıştırmadaki yanıtlanmamış kelimeler atlanmış sayılır. Sonraki alıştırmada bir hata oluşması önceki kaydedilmiş sonuçları geri almaz.

## Tasarım ve teknik kapsam

Teknik görevde paylaşılan tasarım referansı: [VocabBuilder — Figma](https://www.figma.com/file/XRhVBdCX1wPyzCRA567kud/VocabBuilder?type=design&node-id=0-1&mode=design).

Arayüz, sağlanan tasarım ekran görüntüleri temel alınarak hazırlanmıştır. Özel referans dosyaları ve özgün gereksinim belgesi repository içeriğine dahil edilmez. Uygulanan teknik kapsam bu README'nin [Ekranlar ve davranışlar](#ekranlar-ve-davranışlar), [Firebase kurulumu](#firebase-kurulumu) ve [Dil çifti ve servis uyumluluğu](#dil-çifti-ve-servis-uyumluluğu) bölümlerinde özetlenmiştir.

CSS mobile-first yazılmıştır: 320 px'den itibaren akışkan, 375 px mobil, 768 px tablet, 1440 px masaüstü. Mobil ve tablette menü çekmeceye dönüşür. Mobilde Sözlük kategori sütunu ve ilerleme yüzdesi gizlenir. Alıştırma alanları mobil/tablette alt alta, masaüstünde yan yanadır.

Menü kısa ve yatay ekranlarda dikey kaydırılabilir; çizim bağlantıların altında kalır. 568×320 ve 667×375 dahil altı mobil/tablet boyutunda menü bağlantıları, çıkış düğmesine erişim ve kısa ekran kaydırması tarayıcı testiyle doğrulanır.

Öğrenci, kitap ve çalışma kağıdı çizimleri özgün SVG bileşenleridir; tasarım ekran görüntülerinden alınmış raster dosyalar kullanılmaz. SVG'ler yüksek piksel yoğunluklarında keskin kalır ve ek retina bitmap yüklemesi gerektirmez. Firebase kodu gerektiğinde dinamik olarak yüklenir. Fontlar uygulamayla birlikte sunulur, üçüncü taraf font isteği yapılmaz.

Teknik görevdeki yedi karakterli parola kuralı korunur: altı ardışık Latin harfi ve bir rakam. İngilizce alan tek kelime veya boşluklarla ayrılan ifadeleri kabul eder; sözcüklerin içinde kesme işareti ve kısa çizgi kullanılabilir. İngilizce ve Türkçe alanlar en çok 64 karakterdir; Türkçe alan `ç, ğ, ı, İ, ö, ş, ü` harflerini destekler. Kullanıcının dil değişikliği isteği doğrultusunda veri modeli `en` ve `tr`, görev dili ise `en | tr` olarak uygulanmıştır.

## Firebase kurulumu

Varsayılan veri sağlayıcısı Firebase'dir. `.firebaserc` dosyası bu deponun varsayılan hedefini `vocabbuilder-yasin-kr` olarak tanımlar. Bu proje ve web uygulaması oluşturulmuş, **Email/Password** girişi etkinleştirilmiştir. `firebase.json`, giriş sağlayıcısını ve Frankfurt'taki (`europe-west3`) Firestore Standard `(default)` veritabanının yapılandırmasını içerir.

1. Depoyu klonladıktan sonra `.env.example` dosyasını `.env.local` olarak kopyalayın ve projenin web uygulaması yapılandırmasını doldurun. `.env.local` Git tarafından dışlanır; başka bir bilgisayara klonlandığında ayrıca oluşturulmalıdır.
2. Projede Cloud Firestore **Standard** sürümünde `(default)` veritabanı Frankfurt (`europe-west3`) bölgesinde kuruludur. Yeni bir projeye kurulumda `firebase.json` içindeki bölgeyi veritabanını oluşturmadan önce seçin.
3. Firebase CLI ile proje erişimi olan hesabınıza giriş yapın; Authentication ayarlarını, Firestore kurallarını ve indekslerini gönderin:

```sh
npx -y firebase-tools@latest login
npx -y firebase-tools@latest deploy --only "auth,firestore" --project vocabbuilder-yasin-kr
```

4. İndekslerin hazır olmasını bekleyin; ardından `.env.local` değerlerinin yüklenmesi için geliştirme sunucusunu `npm run dev` ile yeniden başlatın.

Başka bir Firebase projesi kullanacaksanız `.firebaserc`, `.env.local`, `package.json` içindeki `deploy:hosting` betiği ve komutlardaki `--project` değerini aynı projeye göre güncelleyin. Windows PowerShell yürütme politikası `npx` betiğini engelliyorsa `npx.cmd` kullanın.

Firestore `words_en_tr` koleksiyonundaki kayıtların sahibi yalnız kendi kelimelerini değiştirebilir. Giriş yapan öğrenciler diğer kullanıcıların public kelimelerini Öneriler ekranında okuyabilir. İlk kurulan boş projede diğer öğrenciler kelime ekleyene kadar öneriler boş olacaktır. Kullanıcı profil belgeleri yalnız sahibi tarafından okunabilir. Önceki dil çiftine ait `words` koleksiyonuna dokunulmaz.

Kategoriler oturum açıldığında `metadata/categories` belgesinden okunup Redux'a alınır; bu isteğe bağlı belge yoksa teknik görevdeki kategori listesi kullanılır. Belgeyi kullanacaksanız `values` alanına desteklenen kategori kodlarını (`verb`, `noun` vb.) içeren bir dizi koyun; uygulama bunları Türkçe adlarıyla gösterir. Aynı kelimenin eşzamanlı eklenmesini önleyen kişisel `wordKeysEnTr` kayıtları, kelimelerle birlikte atomik transaction içinde yönetilir; [Firestore işlem sonrası kuralları](https://firebase.google.com/docs/reference/rules/rules.firestore) bu tutarlılığı denetler.

Sayfalama `limit`, `startAfter` ve sunucu tarafında count aggregation kullanır. Alt dize araması kayıtlardaki normalize edilmiş arama parçalarıyla yapılır. Uzak bir sayfaya ilk kez atlamak önceki sayfaların cursor'larını okumayı gerektirebilir. Yeni bir Firebase projesine kurulum yapıldığında kurallar ve indeksler o projede ayrıca doğrulanmalıdır.

Firebase web config, istemci uygulamasının açık yapılandırmasıdır; servis hesabı veya admin anahtarı koymayın. Erişimi Firestore güvenlik kuralları sınırlar.

## Dil çifti ve servis uyumluluğu

İlk teknik görevdeki [GoIT servisi](https://vocab-builder-backend.p.goit.global/api-docs/) İngilizce–Ukraynaca veri sözleşmesi kullanır. Türkçe çevirileri Ukraynaca alanına göndermemek için bu adaptör kaldırılmıştır. İngilizce–Türkçe sürüm Firebase ve yerel demo üzerinden çalışır. Eski bir `.env.local` dosyasında `VITE_DATA_PROVIDER=goit` varsa kaldırın veya `firebase` olarak değiştirin. Demo verileri gerçek hesaba otomatik aktarılmaz.

## Kontroller

```sh
npm run test
npm run build
npm run dev
npm run test:e2e
```

E2E testleri yerel 5173 sunucusunu ve bilgisayarda kurulu Google Chrome'u kullanır. Her test izole tarayıcı bağlamındaki demo verileriyle çalışır; canlı hesabı veya uzaktaki kelimeleri değiştirmez. Testler konsol hatalarını, temel akışları ve 320/375/768/1440 px taşmalarını denetler.

Firebase kurulumu ayrıca iki geçici hesapla gerçek Authentication ve Firestore üzerinde doğrulandı: kayıt/giriş, oturumun korunması, kelime işlemleri, eşzamanlı tekrar engelleme, Türkçe arama, filtreler, sayfalama, kullanıcılar arası erişim sınırları ve 28 cevabın tek işlemde kaydedilmesi. Bu 16 canlı kontrol tamamlandıktan sonra geçici hesaplar ve test verileri temizlendi.

## Canlı yayın ve güncelleme

Uygulama [Firebase Hosting](https://vocabbuilder-yasin-kr.web.app) üzerinde yayımlanmıştır. `/register`, `/login` ve diğer uygulama rotaları doğrudan açılabilir; `firebase.json` içindeki SPA yönlendirmesi bu istekleri `index.html` dosyasına taşır.

Canlı sitede 12 tarayıcı kontrolü geçti: 375/768/1440 px genişliklerde kayıt/giriş sayfalarının doğrudan açılması, gerçek hesap oluşturma, kelime ekleme, yenileme sonrası oturum ve veri kalıcılığı, çıkış/giriş ve kelime silme. Bu akışta konsol, sayfa veya uygulama isteği hatası görülmedi; geçici hesap ve test verileri temizlendi.

Yayınlamak için proje erişimi olan Firebase hesabıyla CLI'a giriş yapın ve `.env.local` dosyasındaki Firebase web yapılandırmasını doldurun. `VITE_` değişkenleri üretim paketine **derleme sırasında** eklenir; değişikliklerden sonra yeniden derleyip yayımlayın.

```sh
npm run deploy:hosting
```

Bu komut TypeScript kontrolünü ve Vite derlemesini çalıştırır, ardından `dist/` içeriğini `vocabbuilder-yasin-kr` projesinin Hosting servisine gönderir. Firebase Authentication veya Firestore kurallarını değiştirmez. Windows PowerShell gerekirse `npm.cmd run deploy:hosting` kullanabilir.

GitHub'a push yapmak tek başına canlı siteyi güncellemez; kod değişikliklerinden sonra yayın komutu ayrıca çalıştırılmalıdır. Alternatif Netlify kurulumu için `netlify.toml` içindeki SPA yönlendirmesi de korunur.
