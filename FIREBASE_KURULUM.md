# Firebase Google Giriş Kurulumu

## 1. Firebase Projesi Oluştur

1. https://console.firebase.google.com adresine git
2. **"Add project"** tıkla
3. Proje adı ver (örn: "ai-assistant")
4. Google Analytics'i devre dışı bırakabilirsin
5. **"Create project"** tıkla

## 2. Web Uygulaması Ekle

1. Proje sayfasında **"</>"** (Web) ikonuna tıkla
2. Uygulama adı ver (örn: "ai-assistant-web")
3. **"Register app"** tıkla
4. Çıkan `firebaseConfig` değerlerini kopyala

## 3. Google Auth Aktif Et

1. Sol menüden **Authentication** → **Sign-in method**
2. **Google** sağlayıcısına tıkla
3. **Enable** aç
4. Proje destek e-postası seç
5. **Save** tıkla

## 4. .env Dosyası Oluştur

`ai-assistant/frontend/` klasöründe `.env` dosyası oluştur:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=proje-adi.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=proje-adi
VITE_FIREBASE_STORAGE_BUCKET=proje-adi.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 5. Frontend'i Yeniden Başlat

```powershell
cd frontend
npm run dev
```

Artık giriş ekranı çıkacak ve Google ile giriş yapabileceksin!
