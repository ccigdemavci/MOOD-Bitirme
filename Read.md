# MOOD: Yüz Tanıma Destekli Duygu Analizi 

##  Proje Tanıtımı

Bu proje, kullanıcıların yüz ifadeleri aracılığıyla duygusal durumlarını analiz eden ve buna göre kişiselleştirilmiş müzik önerileri sunan, aynı zamanda kullanıcıya özel bir duygusal günlük oluşturan entegre bir web uygulamasıdır.  
Gerçek zamanlı görüntü işleme, yüz tanıma, duygu sınıflandırma ve içerik öneri sistemlerini birleştiren bu sistem; yapay zekâ, derin öğrenme ve insan-bilgisayar etkileşimi alanlarında disiplinler arası bir yaklaşım sunmaktadır.

##  Projenin Amacı

Projenin temel amacı, kullanıcıların ruh hâllerini otomatik olarak tanımlamak ve bu duygulara uygun içerikler sunarak dijital ortamda duygu odaklı bir kullanıcı deneyimi tasarlamaktır.  
Ayrıca yüz tanıma teknolojisi kullanılarak kullanıcıya özel bir **mod günlüğü** oluşturulması ve bu günlüğün istatistiksel olarak görselleştirilmesi hedeflenmiştir.

##  Kullanılan Teknolojiler ve Altyapı

| Katman | Teknolojiler / Kütüphaneler |
|--------|------------------------------|
| **Web Sunucu** | Python (Flask), SQLite |
| **Ön Yüz (Frontend)** | HTML5, CSS3, JavaScript, Chart.js |
| **Görüntü İşleme** | OpenCV, face_recognition, Haar Cascade |
| **Derin Öğrenme** | PyTorch, ResNet34 |
| **API Entegrasyonu** | OpenAI Gemini API, yt-dlp |
| **Veri Saklama** | face_encodings.pkl, SQLite (duygu kayıtları ve notlar) |

##  Model Eğitimi ve Performans

- **Veri Kümesi:** AffectNet (YOLO formatında, 8 duygu sınıfı: Mutlu, Üzgün, Kızgın, Şaşkın, Tiksinti, Korku, Nötr, Utangaç)  
- **Model:** ResNet34 (PyTorch üzerinden tüm katmanlarıyla yeniden eğitildi)  
- **Eğitim:** Google Colab ortamında GPU kullanılarak gerçekleştirildi  
- **Optimizasyon:** Learning rate scheduler ve veri artırma (augmentation) yöntemleri uygulandı  
- **Başarı Değerleri:**
  - Eğitim doğruluğu: **%99.54**
  - Doğrulama doğruluğu: **%74.62**
  - Confusion Matrix analizi ile değerlendirme yapılmıştır

##  Uygulama Akışı

1. **Kamera Erişimi ve Yüz Tanıma**  
   - Uygulama başlatıldığında cihaz kamerası otomatik olarak etkinleştirilir.  
   - Kullanıcının yüzü analiz edilerek sistemde kayıtlı olup olmadığı kontrol edilir.  
   - Tanımlı kullanıcılar otomatik olarak tanınır, yeni kullanıcılar kayıt ekranı üzerinden sisteme eklenir.

2. **Gerçek Zamanlı Duygu Tespiti**  
   - Tanınan kullanıcının yüz ifadesi analiz edilerek 8 temel duygu sınıfından biri tahmin edilir.  
   - Bu sınıflandırma, ResNet34 mimarisiyle eğitilmiş derin öğrenme modeli tarafından gerçekleştirilir.  
   - Tahmin edilen duygu ve model güven skoru, sistem tarafından kayıt altına alınır.

3. **Duygusal İçerik Önerisi**  
   - Belirlenen duygu sınıfı, OpenAI Gemini API aracılığıyla analiz edilir.  
   - Kullanıcının mevcut ruh hâline uygun olarak pozitif bir söz ve toplam dört müzik önerisi (iki Türkçe, iki İngilizce) sunulur.  
   - Müzikler, YouTube üzerinden alınan bağlantılarla birlikte kullanıcıya önerilir.

4. **Veri Kaydı ve Günlük Oluşturma**  
   - Kullanıcı adı, tahmin edilen duygu, güven skoru ve zaman damgası SQLite veritabanına kaydedilir.  
   - Bu veriler, kullanıcının duygusal geçmişini analiz etmek amacıyla kullanılmaktadır.

5. **Mod Günlüğü ve Takvim Sistemi**  
   - Kullanıcı, “Mod Günlüğü” arayüzüne geçerek kendi duygusal geçmişini takvim görünümünde inceleyebilir.  
   - Her güne ait baskın duygu simgelerle ve renk kodlarıyla gösterilir.  
   - Kullanıcı, belirli tarihlere kişisel notlar ekleyebilir. Bu notlar, tarih bazlı olarak veritabanında saklanır.  
   - En sık hissedilen duygu ve ortalama model güveni grafiksel olarak sunulur.

6. **Kişisel Erişim ve Güvenlik**  
   - Günlük sayfasına yalnızca yüz tanıma ile kimliği doğrulanan kullanıcılar erişebilir.  
   - Bu sayede diğer kullanıcıların verilerine erişim engellenerek gizlilik sağlanır.

##  Proje Klasör Yapısı

```
emotion_web_app/
├── app.py
├── emotion_utils.py
├── face_utils.py
├── train.py
├── affectnet_dataset.py
├── face_encodings.pkl
├── database.db
├── .env
├── requirements.txt
│
├── templates/
│   ├── anasayfa.html
│   ├── recommend.html
│   ├── diary.html
│   └── user_diary.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── img/
```

##  Kurulum ve Çalıştırma Adımları

### 1. Sanal Ortam Oluşturma ve Aktifleştirme

```bash
python -m venv emoenv
source emoenv/bin/activate
```

### 2. Gereksinimlerin Kurulumu

```bash
pip install -r requirements.txt
```

### 3. Ortam Değişkenlerinin Tanımlanması

`.env` dosyası içerisine şu satırı ekleyin:

```bash
OPENAI_API_KEY=your_openai_api_key
```

### 4. Uygulamanın Başlatılması

```bash
python app.py
```

Tarayıcı üzerinden `http://127.0.0.1:5000` adresi ziyaret edilerek uygulama kullanılabilir.

##  Karşılaşılan Teknik Zorluklar ve Çözüm Yolları

| Sorun | Açıklama | Çözüm |
|-------|----------|-------|
| OpenCV + base64 uyumsuzluğu | Kameradan alınan verilerin kodlanması sırasında sorun yaşandı | Görüntüler base64 formatına dönüştürülerek çözüm sağlandı |
| MacOS’ta port çakışması | 5000 numaralı port sistemde başka bir servis tarafından kullanılıyordu | Port değişikliği ve AirPlay Receiver kapatılması ile çözüldü |
| Eğitim için donanım yetersizliği | Yerel cihazda GPU bulunmaması | Eğitim süreci Google Colab’a taşındı |
| Farklı ışık koşullarında yüz tanıma sorunu | Kayıtlı yüz görüntüleriyle birebir eşleşmeyen durumlar oluştu | Yüz vektörleri normalize edilerek tolerans değeri ayarlandı |

##  Geliştirici

**Çiğdem Avcı**  
Bursa Teknik Üniversitesi – Bilgisayar Mühendisliği  
2025 Bitirme Projesi
Danışman: Doç. Dr. Erdem YAVUZ

##  Kaynakça

1. AffectNet Dataset  
2. OpenCV Documentation  
3. PyTorch ResNet Implementation  
4. OpenAI GPT (Gemini) API  
5. face_recognition GitHub  
6. Flask Framework
