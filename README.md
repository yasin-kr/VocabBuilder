# VocabBuilder

Türkçe arayüzlü İngilizce–Türkçe kelime öğrenme uygulaması. Kişisel sözlüğünü oluştur, diğer öğrencilerin kelimelerini keşfet ve iki yönlü çeviri alıştırmalarıyla ilerlemeni takip et.

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

Arayüz sağlanan özel tasarım referanslarının web sürümüne göre hazırlanmıştır. Herkese açık Figma bağlantısı sağlanmamıştır. Özel referans dosyaları repository içeriğine dahil edilmez; burada uygulamanın teknik kapsamı bağımsız olarak özetlenmiştir.

CSS mobile-first yazılmıştır: 320 px'den itibaren akışkan, 375 px mobil, 768 px tablet, 1440 px masaüstü. Mobilde menü çekmeceye dönüşür, Sözlük kategori sütunu ve ilerleme yüzdesi gizlenir. Alıştırma alanları mobil/tablette alt alta, masaüstünde yan yanadır.

Öğrenci, kitap ve çalışma kağıdı çizimleri özgün SVG bileşenleridir; tasarım ekran görüntülerinden alınmış raster dosyalar kullanılmaz. SVG'ler yüksek piksel yoğunluklarında keskin kalır ve ek retina bitmap yüklemesi gerektirmez. Firebase kodu gerektiğinde dinamik olarak yüklenir. Fontlar uygulamayla birlikte sunulur, üçüncü taraf font isteği yapılmaz.

Teknik görevdeki yedi karakterli parola kuralı korunur: altı ardışık Latin harfi ve bir rakam. İngilizce kelime desenindeki kaçışlı yıldız yazım hatası, kelime/ifade kabul eden tam eşleşme olarak uygulanmıştır. İngilizce ve Türkçe alanlar en çok 64 karakterdir; Türkçe alan `ç, ğ, ı, İ, ö, ş, ü` harflerini destekler. Kullanıcının dil değişikliği isteği doğrultusunda veri modeli `en` ve `tr`, görev dili ise `en | tr` olarak uygulanmıştır.

## Firebase kurulumu

Yeni değerlendirme kriteri gereği varsayılan veri sağlayıcısı Firebase'dir. Bir Firebase projesinin web yapılandırması eklenene kadar gerçek kayıt/giriş etkin değildir; demo alanı kullanılabilir.

1. Firebase Console'da bir proje ve web uygulaması oluşturun.
2. Authentication → Sign-in method bölümünde **Email/Password** seçeneğini etkinleştirin.
3. Cloud Firestore veritabanını oluşturun.
4. `.env.example` dosyasını `.env.local` olarak kopyalayıp web uygulamasının yapılandırmasını doldurun. `.env.local` Git tarafından dışlanır.
5. Firebase CLI ile giriş yapıp kuralları ve indeksleri ilgili projeye gönderin:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

6. İndeksler hazır olduğunda geliştirme sunucusunu yeniden başlatın.

Firestore `words_en_tr` koleksiyonundaki kayıtların sahibi yalnız kendi kelimelerini değiştirebilir. Giriş yapan öğrenciler diğer kullanıcıların public kelimelerini Öneriler ekranında okuyabilir. İlk kurulan boş projede diğer öğrenciler kelime ekleyene kadar öneriler boş olacaktır. Kullanıcı profil belgeleri yalnız sahibi tarafından okunabilir. Önceki dil çiftine ait `words` koleksiyonuna dokunulmaz.

Kategoriler oturum açıldığında `metadata/categories` belgesinden okunup Redux'a alınır; bu isteğe bağlı belge yoksa teknik görevdeki kategori listesi kullanılır. Belgeyi kullanacaksanız `values` alanına desteklenen kategori kodlarını (`verb`, `noun` vb.) içeren bir dizi koyun; uygulama bunları Türkçe adlarıyla gösterir. Aynı kelimenin eşzamanlı eklenmesini önleyen kişisel `wordKeysEnTr` kayıtları, kelimelerle birlikte atomik transaction içinde yönetilir; [Firestore işlem sonrası kuralları](https://firebase.google.com/docs/reference/rules/rules.firestore) bu tutarlılığı denetler.

Sayfalama `limit`, `startAfter` ve sunucu tarafında count aggregation kullanır. Alt dize araması kayıtlardaki normalize edilmiş arama parçalarıyla yapılır. Uzak bir sayfaya ilk kez atlamak önceki sayfaların cursor'larını okumayı gerektirebilir. Firestore kuralları ve indeksler canlı bir Firebase projesinde ayrıca doğrulanmalıdır.

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

## Yayına hazırlama

```sh
npm run build
```

Üretim çıktısı `dist/` içindedir. Netlify için `netlify.toml`, Firebase Hosting için `firebase.json` SPA yönlendirmeleri hazırdır. Hosting ortamına Firebase web değişkenlerini ekleyin ve gerçek girişin kullanılacağı domain'i Firebase Authentication → Authorized domains listesine ekleyin.

Bu çalışma yerel önizleme olarak hazırlanmıştır; henüz canlı hosta deploy edilmemiştir.
