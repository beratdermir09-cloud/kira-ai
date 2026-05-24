# 🤖 AI Assistant v2.0

ChatGPT benzeri, tam özellikli yapay zeka asistanı.

## ✨ Özellikler

- 💬 **Gerçek zamanlı streaming** — yanıtlar token token gelir
- 📁 **Dosya yükleme** — PDF, DOCX, TXT, kod dosyaları
- 🗂️ **Sohbet geçmişi** — tüm konuşmalar kaydedilir
- ✏️ **Sohbet yönetimi** — yeniden adlandır, sil
- 🎨 **Markdown render** — başlıklar, listeler, tablolar
- 💻 **Kod highlighting** — 100+ dil desteği
- 🔄 **Model seçimi** — GPT-4o, GPT-4o Mini, GPT-3.5
- 🌙 **Dark mode** — göz yormayan koyu tema

## 🚀 Kurulum

### Gereksinimler
- Python 3.10+
- Node.js 18+
- Groq API Key — **Ücretsiz** → [console.groq.com](https://console.groq.com)

### Adımlar

1. **Kurulum scriptini çalıştır:**
   ```
   setup.bat
   ```

2. **API key ekle:**
   `backend/.env` dosyasını aç ve düzenle:
   ```
   GROQ_API_KEY=gsk_...buraya_api_keyin...
   ```

3. **Uygulamayı başlat:**
   ```
   start.bat
   ```

4. Tarayıcıda aç: **http://localhost:3000**

## 📁 Proje Yapısı

```
ai-assistant/
├── backend/
│   ├── main.py              # FastAPI uygulaması
│   ├── routes/
│   │   ├── chat.py          # Streaming chat endpoint
│   │   └── conversations.py # CRUD endpoints
│   ├── services/
│   │   ├── ai_service.py    # OpenAI entegrasyonu
│   │   ├── file_processor.py # Dosya işleme
│   │   └── storage.py       # JSON tabanlı depolama
│   └── models/
│       └── schemas.py       # Pydantic modeller
└── frontend/
    └── src/
        ├── App.tsx           # Ana uygulama
        ├── components/
        │   ├── Sidebar.tsx   # Sohbet listesi
        │   ├── ChatWindow.tsx # Mesaj alanı
        │   ├── MessageBubble.tsx # Mesaj balonu
        │   ├── ChatInput.tsx # Giriş alanı
        │   └── Header.tsx    # Üst bar
        ├── api.ts            # API çağrıları
        └── types.ts          # TypeScript tipleri
```

## ⚙️ Konfigürasyon

`backend/.env` dosyasında:

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `OPENAI_API_KEY` | OpenAI API anahtarı | - |
| `MODEL_NAME` | Kullanılacak model | `gpt-4o` |
| `MAX_TOKENS` | Maksimum token | `4096` |
| `TEMPERATURE` | Yaratıcılık (0-1) | `0.7` |

## 🛠️ Geliştirme

Backend:
```bash
cd backend
venv\Scripts\activate
python main.py
```

Frontend:
```bash
cd frontend
npm run dev
```

API Docs: http://localhost:8000/docs
