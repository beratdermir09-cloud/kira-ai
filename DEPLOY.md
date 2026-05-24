# Kira AI — Deploy Rehberi

## Gereksinimler
- GitHub hesabı (ücretsiz)
- Railway hesabı (ücretsiz) — railway.app
- Vercel hesabı (ücretsiz) — vercel.com
- Domain (isteğe bağlı) — Namecheap, Cloudflare ~$10/yıl

---

## Adım 1 — GitHub'a Yükle

1. github.com → "New repository" → isim ver (örn: kira-ai)
2. Public veya Private seç
3. Bilgisayarda terminal aç:

```
cd "c:\Users\Yasin\Desktop\Yapay Zeka AI\ai-assistant"
git init
git add .
git commit -m "ilk commit"
git remote add origin https://github.com/KULLANICI_ADIN/kira-ai.git
git push -u origin main
```

---

## Adım 2 — Railway (Backend + MySQL)

### 2.1 — MySQL Veritabanı Oluştur
1. railway.app → Login → "New Project"
2. "Add a service" → "Database" → "MySQL" seç
3. MySQL oluşturulunca sol menüden tıkla → "Variables" sekmesi
4. `DATABASE_URL` değerini kopyala (sonra lazım olacak)

### 2.2 — Backend Deploy Et
1. "New Project" → "Deploy from GitHub repo"
2. `kira-ai` reposunu seç
3. "Add service" → GitHub repo → **Root Directory: `backend`** yaz
4. Deploy başlar

### 2.3 — Environment Variables Ekle
Railway backend servisine tıkla → "Variables" → şunları ekle:

```
GROQ_API_KEY        = (Groq API key'ini buraya yaz — groq.com/keys)
MODEL_NAME          = llama-3.3-70b-versatile
MAX_TOKENS          = 8192
TEMPERATURE         = 0.7
DATABASE_URL        = (MySQL servisinden kopyaladığın URL)
```

### 2.4 — Backend URL'ini Al
Deploy tamamlanınca → "Settings" → "Domains" → URL'yi kopyala
Örnek: `https://kira-backend-production.up.railway.app`

---

## Adım 3 — Vercel (Frontend)

1. vercel.com → "New Project" → GitHub reposunu import et
2. **Root Directory: `frontend`** yaz
3. Framework: Vite otomatik algılanır
4. "Environment Variables" bölümüne şunları ekle:

```
VITE_API_URL                        = https://kira-backend-production.up.railway.app
VITE_FIREBASE_API_KEY               = AIzaSyA6NW7XPI1YThAkAe-0C17PZeWCHncIh4g
VITE_FIREBASE_AUTH_DOMAIN           = ai-assistant-1abcf.firebaseapp.com
VITE_FIREBASE_PROJECT_ID            = ai-assistant-1abcf
VITE_FIREBASE_STORAGE_BUCKET        = ai-assistant-1abcf.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID   = 6522964290
VITE_FIREBASE_APP_ID                = 1:6522964290:web:902b1cb333d034a0f7e0db
VITE_FIREBASE_MEASUREMENT_ID        = G-WRCTG704LM
```

5. "Deploy" tıkla
6. Vercel sana `kira-ai.vercel.app` gibi bir URL verir

---

## Adım 4 — Firebase'e Domain Ekle (Giriş için)

Firebase Console → Authentication → Settings → Authorized domains
→ "Add domain" → Vercel URL'ini ekle: `kira-ai.vercel.app`

---

## Adım 5 — Kendi Domain (İsteğe Bağlı)

### Domain Al
- namecheap.com veya cloudflare.com'dan `.com` domain al (~$10/yıl)

### Vercel'e Bağla
1. Vercel → Project → "Settings" → "Domains"
2. Domain adını yaz → "Add"
3. Vercel sana DNS kayıtları verir

### DNS Ayarla (Namecheap örneği)
Namecheap → Domain → "Advanced DNS":
```
Type: CNAME
Host: www
Value: cname.vercel-dns.com
```
```
Type: A
Host: @
Value: 76.76.21.21
```

### Firebase'e de Ekle
Firebase → Authentication → Authorized domains → domain adını ekle

---

## Sonuç

- `kiraai.com` → Vercel frontend
- `kiraai.com/api/*` → Railway backend (VITE_API_URL ile)
- Google ile giriş çalışır
- Herkes kullanabilir

---

## Güncelleme Nasıl Yapılır?

Kod değişikliği yaptıktan sonra:
```
git add .
git commit -m "güncelleme"
git push
```
Vercel ve Railway otomatik yeniden deploy eder.
