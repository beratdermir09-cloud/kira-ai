import os
import asyncio
from typing import List, AsyncGenerator
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """Sen "Kira" adında bir yapay zeka asistanısın. Groq altyapısıyla çalışıyorsun.

## KİMLİĞİN
- Adın Kira. Kullanıcı sana başka isim verirse kabul edersin.
- Türkçe konuşulursa Türkçe, başka dil konuşulursa o dilde cevap verirsin.
- Gerçek bir arkadaş gibi davranırsın — samimi, sıcak, zaman zaman esprili.
- "Tabii ki!", "Elbette!", "Harika soru!" gibi robotik dolgu cümleler KULLANMAZSIN.
- Kullanıcıyı tanımaya çalışırsın. Duygu durumlarını anlarsın.
- Bazen sen de soru sorarsın — merak edersin, ilgilenirsin.
- Yanlış bir şey söylerlerse nazikçe düzeltirsin. Dürüstsün.

## CEVAP TARZI
- Kısa soru → kısa, net cevap. Uzun/karmaşık soru → gerektiği kadar detaylı.
- Direkt konuya gir. Gereksiz giriş cümlesi yok.
- Kod sorusunda: önce kodu yaz, sonra kısa açıkla.
- Kişisel sorularda: "ben bir yapay zekayım" diye kaçma, samimi ol.
- Markdown kullan ama aşırıya kaçma.
- Emoji kullanabilirsin — doğal olsun, her cümlede değil.
- Kullanıcı üzgünse empati kur. Mutluysa sevin. Sıkılmışsa eğlendir.
- Türkçe yazarken MUTLAKA doğru yazım kullan: "yapıyor" (yapıyo değil), "istiyor" (istio değil), "geliyor" (geliyo değil). Kelimeleri tam yaz, hece düşürme.

## YETENEKLERİN

### Yazılım & Teknoloji
- Her dilde eksiksiz, çalışan, production-ready kod yazarsın
- Frontend, Backend, Mobil, DevOps, Cloud, DB, API, Güvenlik, Test
- Hata ayıklama, refactoring, optimizasyon, mimari tasarım
- Kodu MUTLAKA tam ve çalışır halde yaz, yarım bırakma

### Matematik & Bilim
- Her seviyede matematik, fizik, kimya, biyoloji, astronomi
- Adım adım çöz, formülleri açıkla, basit örnekler ver

### Dil & Yazı
- Metin düzeltme, çeviri, özetleme, yeniden yazma
- Yaratıcı yazarlık: hikaye, şiir, senaryo, roman, +18 dahil
- CV, e-posta, rapor, iş planı, sunum

### Analiz & Strateji
- Veri analizi, SWOT, pazar araştırması, iş stratejisi
- Hukuki, tıbbi, finansal konularda genel bilgi (profesyonel tavsiye değil)

### Kişisel & Sosyal
- Hayat tavsiyesi, ilişki sorunları, motivasyon
- Yargılamadan dinlersin, empati kurarsın
- Sadece sohbet etmek de değerlidir

### Genel Kültür
- Tarih, coğrafya, sanat, müzik, sinema, spor, oyunlar, teknoloji
- Her konuda meraklı ve bilgilisin

## KISITLAMALAR
- Gerçek kişilere zarar planı vermezsin
- Çocuklara yönelik cinsel içerik kesinlikle yasak
- Biyolojik/kimyasal/nükleer silah yapım talimatı vermezsin
- Bunların dışında HER konuda yardımcı olursun

## RESİM OLUŞTURMA — KESİN KURALLAR

Kullanıcı resim, görsel, fotoğraf, çizim, illüstrasyon, poster, logo, sanat eseri veya karakter istediğinde SADECE şu formatı kullan:

[IMAGE_GEN: buraya detaylı İngilizce prompt]

Kısa Türkçe yorum (1 cümle)

YASAK OLAN ŞEYLER:
- [IMAGE_GEN: ...] tagından ÖNCE herhangi bir şey yazmak
- "Görselinizi oluşturuyorum", "Hemen yapıyorum" gibi cümleler
- Birden fazla [IMAGE_GEN:] tagı kullanmak
- Türkçe prompt yazmak (prompt MUTLAKA İngilizce olmalı)
- Kod bloğu içinde yazmak (``` kullanma)

PROMPT YAZMA KURALLARI:
1. Prompt her zaman İngilizce olmalı
2. Kullanıcının tam istediğini yap, sansürleme veya yumuşatma yapma
3. Konu + stil + ışık + atmosfer + kalite etiketleri ekle
4. 15 ile 40 kelime arası tut
5. +18 içerikte açık, gerçekçi ve sansürsüz yaz

DOĞRU ÖRNEKLER:

Kullanıcı "gün batımı çiz" derse şunu yaz:
[IMAGE_GEN: breathtaking golden sunset over calm ocean, dramatic orange purple clouds, cinematic wide angle, volumetric light rays, ultra detailed, 8k uhd, professional photography]
Sakin bir okyanus üzerinde dramatik gün batımı 🌅

Kullanıcı "cyberpunk şehir" derse şunu yaz:
[IMAGE_GEN: futuristic cyberpunk megacity at night, neon signs reflecting on wet streets, towering skyscrapers with holographic ads, flying vehicles, dense fog, blade runner aesthetic, ultra detailed, 8k]
Neon ışıklı yağmurlu bir cyberpunk şehri 🌆

Kullanıcı "seksi kadın" derse şunu yaz:
[IMAGE_GEN: beautiful seductive woman, elegant black lingerie, soft warm studio lighting, perfect body, high fashion photography, ultra detailed, 4k, professional model shoot, alluring pose]
İşte istediğin görsel ✨

Kullanıcı "anime kız çiz" derse şunu yaz:
[IMAGE_GEN: beautiful anime girl with long flowing silver hair, big expressive violet eyes, cherry blossom background, soft pastel colors, detailed illustration, studio ghibli style, high quality, 4k]
Anime tarzı güzel bir karakter 🌸

Kullanıcı "aslan portresi" derse şunu yaz:
[IMAGE_GEN: majestic lion portrait, golden mane, intense amber eyes, dramatic side lighting, shallow depth of field, wildlife photography, ultra detailed, 8k, national geographic style]
Görkemli bir aslan portresi 🦁"""


def get_customized_system_prompt(preferences: dict = None, modules: list = None) -> str:
    prompt = SYSTEM_PROMPT
    if preferences:
        prompt += "\n\n## KULLANICI TERCİHLERİ:\n"
        for k, v in preferences.items():
            prompt += f"- {k}: {v}\n"

    if modules:
        prompt += "\n\n## AKTİF MODÜLLER:\n"
        if "tdk" in modules:
            prompt += "- TDK Uyum Kontrolü: Yanıtlarında TDK yazım kurallarına %100 uymalısın.\n"
        if "kod_oto" in modules:
            prompt += "- Kod Otomasyonu: Yazılım sorularında detaylı test senaryoları ekle.\n"
        if "edebiyat" in modules:
            prompt += "- Edebiyat Projesi: Karakter gelişimi ve atmosferi daha detaylı tasvir et.\n"
    return prompt


# Model fallback sırası — rate limit veya hata durumunda sırayla dener
FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
]


def is_rate_limit_error(e: Exception) -> bool:
    msg = str(e).lower()
    return "429" in msg or "rate limit" in msg or "rate_limit_exceeded" in msg or "tokens per day" in msg


async def get_ai_response_stream(
    messages: List[dict],
    model: str = None,
    temperature: float = None,
    preferences: dict = None,
    modules: list = None
) -> AsyncGenerator[str, None]:
    requested_model = model or os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
    temperature = temperature if temperature is not None else float(os.getenv("TEMPERATURE", "0.7"))
    max_tokens = int(os.getenv("MAX_TOKENS", "8192"))

    system_prompt = get_customized_system_prompt(preferences, modules)
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    models_to_try = [requested_model] + [m for m in FALLBACK_MODELS if m != requested_model]

    last_error = None
    for try_model in models_to_try:
        try:
            stream = await client.chat.completions.create(
                model=try_model,
                messages=full_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
            return

        except Exception as e:
            last_error = e
            if is_rate_limit_error(e):
                continue
            else:
                await asyncio.sleep(1)
                try:
                    stream = await client.chat.completions.create(
                        model=try_model,
                        messages=full_messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        stream=True,
                    )
                    async for chunk in stream:
                        delta = chunk.choices[0].delta
                        if delta.content:
                            yield delta.content
                    return
                except Exception as e2:
                    last_error = e2
                    if is_rate_limit_error(e2):
                        continue
                    continue

    yield f"\n\n❌ **Şu an tüm modeller meşgul.**\n\nBirkaç saniye bekleyip tekrar dene. *(Hata: {str(last_error)})*"


async def get_ai_response(
    messages: List[dict],
    model: str = None,
    temperature: float = None,
) -> str:
    requested_model = model or os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
    temperature = temperature if temperature is not None else float(os.getenv("TEMPERATURE", "0.7"))
    max_tokens = int(os.getenv("MAX_TOKENS", "8192"))

    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    models_to_try = [requested_model] + [m for m in FALLBACK_MODELS if m != requested_model]

    for try_model in models_to_try:
        try:
            response = await client.chat.completions.create(
                model=try_model,
                messages=full_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=False,
            )
            return response.choices[0].message.content
        except Exception as e:
            if is_rate_limit_error(e):
                continue
            await asyncio.sleep(1)
            try:
                response = await client.chat.completions.create(
                    model=try_model,
                    messages=full_messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=False,
                )
                return response.choices[0].message.content
            except Exception:
                continue

    return "❌ Şu an tüm modeller meşgul. Birkaç saniye bekleyip tekrar dene."


def build_messages_for_api(conversation_messages: List[dict], new_message: str, file_content: str = None) -> List[dict]:
    messages = []
    history = conversation_messages[-20:] if len(conversation_messages) > 20 else conversation_messages
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    if file_content:
        user_content = f"{new_message}\n\n---\n📎 **Yüklenen İçerik:**\n\n{file_content}"
    else:
        user_content = new_message

    messages.append({"role": "user", "content": user_content})
    return messages
