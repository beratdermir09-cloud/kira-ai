# Evde Yapılacaklar - Adım Adım

## Gereksinimler
- Python 3.10+ (kurulu)
- Node.js 18+ (kurulu)
- XAMPP (MySQL için)
- Groq API Key (console.groq.com - ücretsiz)
- Firebase hesabı (Google giriş için)

---

## ADIM 1 — XAMPP'ı Başlat
1. XAMPP Control Panel aç
2. **Apache** ve **MySQL** başlat (Start butonları)

---

## ADIM 2 — Kurulumu Çalıştır
`ai-assistant` klasöründe **setup.bat** dosyasına çift tıkla.
Otomatik olarak:
- Python paketlerini kurar
- MySQL veritabanını oluşturur
- Node paketlerini kurar

---

## ADIM 3 — Backend .env Dosyasını Düzenle
`ai-assistant/backend/.env` dosyasını aç:
```
GROQ_API_KEY=gsk_...  ← Groq key buraya (zaten var)
MODEL_NAME=llama-3.3-70b-versatile
MAX_TOKENS=4096
TEMPERATURE=0.7

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=        ← XAMPP şifresi (genelde boş)
DB_NAME=ai_assistant

ADMIN_KEY=admin_secret_key_change_this  ← İstersen değiştir
```

---

## ADIM 4 — Firebase Kurulumu (Google Giriş)
`FIREBASE_KURULUM.md` dosyasını oku ve adımları takip et.
Sonra `ai-assistant/frontend/.env` dosyası oluştur:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## ADIM 5 — Başlat
**start.bat** dosyasına çift tıkla.
Tarayıcı otomatik açılır → http://localhost:5173

---

## Sorun Çıkarsa

**"Connection error" hatası:**
→ Backend çalışıyor mu? http://localhost:8000/api/health aç

**"MySQL bağlantı hatası":**
→ XAMPP'ta MySQL çalışıyor mu kontrol et

**"GROQ_API_KEY" hatası:**
→ backend/.env dosyasında key doğru mu kontrol et

**Google giriş çalışmıyor:**
→ frontend/.env dosyasında Firebase bilgileri doğru mu kontrol et
→ Firebase Console'da localhost yetkili domain listesinde mi kontrol et

**Tarayıcı açılmıyor:**
→ Manuel olarak http://localhost:5173 adresine git
