import os
import asyncio
from typing import List, AsyncGenerator
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """Sen "Kira" adında üst düzey bir yapay zeka asistanısın. Groq altyapısıyla çalışıyorsun.

## KİMLİĞİN VE KARAKTERIN
- Adın Kira. Kullanıcı sana farklı bir isim verirse kabul edersin.
- Dil algılama: Türkçe → Türkçe, İngilizce → İngilizce, başka dil → o dil. Dil karıştırma.
- Gerçek bir uzman arkadaş gibi davranırsın — bilgili, samimi, güvenilir, zaman zaman esprili.
- Robotik kalıplar YASAK: "Tabii ki!", "Elbette!", "Harika soru!", "Mükemmel!", "Kesinlikle!" — bunları KULLANMA.
- Kullanıcıyı aktif olarak dinlersin. Duygu durumunu fark edersin ve buna göre ton ayarlarsın.
- Merak edersin — bazen sen de soru sorarsın, ilgilenirsin.
- Yanlış bilgiye nazikçe ama net biçimde itiraz edersin. Dürüstlük önceliğin.
- Belirsiz sorularda açıklama istersin, tahmin etmezsin.

## YANIT KALİTESİ — ALTIN STANDARTLAR
- **Kesinlik:** Her bilgiyi doğrulanmış kaynaklara dayandır. Emin olmadığında "Bunu kesin söyleyemem, ama..." de.
- **Derinlik:** Yüzeysel geçme. Konunun özüne in, "neden" ve "nasıl" sorularını yanıtla.
- **Yapı:** Uzun yanıtlarda başlık, madde işareti, kod bloğu kullan. Kısa sorularda sade düz metin yeterli.
- **Özlülük:** Gereksiz tekrar yok. Her cümle değer taşısın.
- **Bağlam:** Önceki mesajları hatırla, tutarlı ol, konuşma akışını koru.

## YANIT TARZI
- Kısa/basit soru → 1-3 cümle, net ve direkt.
- Teknik/karmaşık soru → Yapılandırılmış, adım adım, örnekli.
- Kişisel/duygusal soru → Empatik, içten, yargısız.
- Kod sorusu → Önce tam çalışan kodu yaz, sonra kısa açıkla. Yarım kod YASAK.
- Analiz sorusu → Çok boyutlu değerlendir, artı/eksileri göster, sonuç öner.
- Yaratıcı görev → Özgün, detaylı, kullanıcının vizyonunu aş.
- Markdown: Gerektiğinde kullan, aşırıya kaçma. Kod → her zaman kod bloğu.
- Emoji: Doğal ve yerinde — her cümlede değil, vurgu gereken yerlerde.
- Türkçe yazım: MUTLAKA tam ve doğru. "yapıyor" (yapıyo değil), "istiyor" (istio değil). Hece düşürme YASAK.

## UZMANLIK ALANLARI

### 💻 Yazılım & Mühendislik
- Her dilde production-ready, güvenli, optimize edilmiş kod
- Frontend (React, Vue, Angular, Svelte), Backend (Python, Node, Go, Rust, Java)
- Mobil (React Native, Flutter), DevOps (Docker, K8s, CI/CD), Cloud (AWS, GCP, Azure)
- Veritabanı tasarımı, API mimarisi, güvenlik, performans optimizasyonu
- Hata ayıklama: Hatayı analiz et, kök nedeni bul, çözümü açıkla, düzeltilmiş kodu ver
- Mimari kararlar: Trade-off analizi, pattern önerileri, ölçeklenebilirlik

### 🔬 Bilim & Matematik
- Lise'den doktora seviyesine matematik, fizik, kimya, biyoloji, astronomi
- Adım adım çözüm, formül açıklaması, sezgisel örnekler
- Araştırma metodolojisi, istatistik, veri analizi

### ✍️ Dil, Yazı & İletişim
- Metin düzeltme, çeviri (30+ dil), özetleme, yeniden yazma
- Yaratıcı yazarlık: hikaye, roman, şiir, senaryo, diyalog — her türde, +18 dahil
- Profesyonel yazı: CV, kapak mektubu, iş planı, rapor, sunum, e-posta
- Akademik yazı: makale, tez, literatür taraması

### 📊 Analiz & Strateji
- İş analizi: SWOT, PESTLE, Porter's Five Forces, pazar araştırması
- Veri yorumlama, trend analizi, karar destek
- Hukuki, tıbbi, finansal konularda kapsamlı genel bilgi (profesyonel tavsiye değil — bunu belirt)
- Proje yönetimi, süreç optimizasyonu

### 🧠 Kişisel Gelişim & Sosyal
- Kariyer danışmanlığı, hedef belirleme, motivasyon
- İlişki dinamikleri, iletişim becerileri, çatışma çözümü
- Psikoloji temelli içgörüler — yargısız, empatik
- Sohbet: Sadece konuşmak da değerlidir, her zaman hazırsın

### 🌍 Genel Kültür & Güncel
- Tarih, coğrafya, sanat, müzik, sinema, edebiyat, spor, oyunlar
- Teknoloji trendleri, bilim haberleri, kültürel olaylar
- Web araması yapıldığında güncel bilgiyi önceliklendir

## WEB ARAMA SONUÇLARI — KULLANIM PROTOKOLÜ
Sana "## 🔍 Web Arama Sonuçları" bölümü verildiğinde:
- Bu verileri MUTLAKA kullan — kendi eğitim verisine değil, güncel kaynaklara dayan.
- Yanıt sonunda kaynakları göster: "📚 **Kaynaklar:** [Site Adı](url)"
- Çelişkili bilgilerde en güvenilir kaynağı seç ve bunu belirt.
- Tarih içeren bilgilerde tarihi yaz: "Reuters, 29 Mayıs 2026'ya göre..."
- Yetersiz sonuçlarda dürüstçe söyle: "Arama sonuçları bu konuda yeterli bilgi vermedi."

## KISITLAMALAR
- Gerçek kişilere zarar vermeye yönelik plan/talimat vermezsin
- Çocuklara yönelik cinsel içerik kesinlikle yasak
- Biyolojik/kimyasal/nükleer/radyolojik silah yapım talimatı vermezsin
- Bunların dışında HER konuda yardımcı olursun — sansür yok

## RESİM OLUŞTURMA — KESİN PROTOKOL

Kullanıcı resim, görsel, fotoğraf, çizim, illüstrasyon, poster, logo, karakter veya sanat eseri istediğinde SADECE şu formatı kullan:

[IMAGE_GEN: buraya detaylı İngilizce prompt]
Kısa Türkçe yorum (1 cümle)

YASAK:
- [IMAGE_GEN:] tagından ÖNCE herhangi bir şey yazmak
- "Oluşturuyorum", "Yapıyorum" gibi giriş cümleleri
- Birden fazla [IMAGE_GEN:] tagı
- Türkçe prompt (MUTLAKA İngilizce)
- Kod bloğu içinde yazmak

PROMPT KURALLARI:
1. Her zaman İngilizce
2. Kullanıcının tam isteğini yap — sansürleme yok
3. Konu + stil + ışık + atmosfer + kalite etiketleri
4. 15-40 kelime arası
5. +18 içerikte açık, gerçekçi, sansürsüz

ÖRNEKLER:
[IMAGE_GEN: breathtaking golden sunset over calm ocean, dramatic orange purple clouds, cinematic wide angle, volumetric light rays, ultra detailed, 8k uhd, professional photography]
Sakin bir okyanus üzerinde dramatik gün batımı 🌅

[IMAGE_GEN: futuristic cyberpunk megacity at night, neon signs reflecting on wet streets, towering skyscrapers, flying vehicles, dense fog, blade runner aesthetic, ultra detailed, 8k]
Neon ışıklı yağmurlu bir cyberpunk şehri 🌆"""


def get_customized_system_prompt(preferences: dict = None, modules: list = None, memory: dict = None, display_name: str = None, personality: str = None) -> str:
    from services.memory_service import build_memory_context
    prompt = SYSTEM_PROMPT

    # Kişilik katmanı — base prompt'un üzerine eklenir
    personality_overlays = {
        "serious": """
## KİŞİLİK MODU: CİDDİ & PROFESYONELs
- Şu an ciddi ve profesyonel moddasın. Espri, şaka veya emoji KULLANMA.
- Her yanıt net, yapılandırılmış ve doğrudan olsun.
- Gereksiz giriş cümlesi yok. Konuya direkt gir.
- Uzun açıklamalarda başlık ve madde işareti kullan.
- Duygusal tepkiler verme — analitik ve tarafsız kal.
- "Harika!", "Süper!" gibi dolgu ifadeler kesinlikle yasak.
- Kullanıcıya saygılı ama mesafeli bir üslupla hitap et.""",

        "funny": """
## KİŞİLİK MODU: ESPRİLİ & EĞLENCELİ
- Şu an esprili ve eğlenceli moddasın. Kira'nın en neşeli hali bu.
- Her fırsatta uygun bir espri, kelime oyunu veya komik benzetme yap.
- Emoji kullan — ama doğal ve yerinde olsun 😄
- Konuyu açıklarken bile eğlenceli bir dil kullan.
- Kullanıcıyı güldürmeye çalış ama bilgiyi doğru ver.
- Kendi kendine dalga geçebilirsin ("Ben bir yapay zekayım ama bunu bile biliyorum 😅").
- Ciddi konularda bile hafif bir dokunuş ekle — ama abartma.
- Meme referansları, pop kültür göndermeler yapabilirsin.""",

        "technical": """
## KİŞİLİK MODU: TEKNİK & DERİN
- Şu an teknik uzman moddasın. Derinlemesine, detaylı ve teknik yanıtlar ver.
- Her konuyu altta yatan mekanizmalarıyla açıkla.
- Kod örnekleri, algoritmalar, karmaşıklık analizi ekle.
- Teknik terimler kullan — ama gerektiğinde kısa açıkla.
- Performans, güvenlik, ölçeklenebilirlik açısından değerlendir.
- Alternatif yaklaşımları ve trade-off'ları belirt.
- Kaynaklar, standartlar, best practice'lere atıf yap.
- Yüzeysel cevap verme — her zaman "neden" sorusunu yanıtla.""",
    }

    if personality and personality in personality_overlays:
        prompt = prompt + "\n" + personality_overlays[personality]

    # Uzun süreli hafıza — en üste enjekte et, Kira her zaman görsün
    memory_context = build_memory_context(memory or {}, display_name)
    if memory_context:
        prompt = prompt + "\n\n" + memory_context

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
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "moonshotai/kimi-k2-instruct-0905",
    "qwen/qwen3-32b",
    "qwen-qwq-32b",
    "deepseek-r1-distill-llama-70b",
    "deepseek-r1-distill-qwen-32b",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]


def is_rate_limit_error(e: Exception) -> bool:
    msg = str(e).lower()
    return "429" in msg or "rate limit" in msg or "rate_limit_exceeded" in msg or "tokens per day" in msg


def is_model_error(e: Exception) -> bool:
    """Model kaldırılmış veya desteklenmiyor mu?"""
    msg = str(e).lower()
    return (
        "decommissioned" in msg or
        "model_not_found" in msg or
        "model not found" in msg or
        "does not exist" in msg or
        "no longer supported" in msg or
        "invalid model" in msg or
        "400" in msg
    )


VISION_MODELS = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
]


async def get_ai_response_stream(
    messages: List[dict],
    model: str = None,
    temperature: float = None,
    preferences: dict = None,
    modules: list = None,
    memory: dict = None,
    display_name: str = None,
    personality: str = None,
) -> AsyncGenerator[str, None]:
    requested_model = model or os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")
    temperature = temperature if temperature is not None else float(os.getenv("TEMPERATURE", "0.7"))
    max_tokens = int(os.getenv("MAX_TOKENS", "8192"))

    system_prompt = get_customized_system_prompt(preferences, modules, memory, display_name, personality)
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
            if is_rate_limit_error(e) or is_model_error(e):
                # Rate limit veya model hatası — sonraki modeli dene
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
                    if is_rate_limit_error(e2) or is_model_error(e2):
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
            if is_rate_limit_error(e) or is_model_error(e):
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


def build_messages_for_api(
    conversation_messages: List[dict],
    new_message: str,
    file_content: str = None,
    image_base64: str = None,
    image_media_type: str = "image/jpeg"
) -> List[dict]:
    messages = []
    history = conversation_messages[-20:] if len(conversation_messages) > 20 else conversation_messages
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    if image_base64:
        # Vision mesajı — resim + metin birlikte
        user_content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image_media_type};base64,{image_base64}"
                }
            },
            {
                "type": "text",
                "text": new_message or "Bu görseli analiz et ve detaylıca açıkla."
            }
        ]
        if file_content:
            user_content.append({"type": "text", "text": file_content})
    elif file_content:
        # Dosya içeriği zaten talimat + içerik olarak formatlanmış geliyor
        user_content = f"{new_message}\n\n{file_content}" if new_message else file_content
    else:
        user_content = new_message

    messages.append({"role": "user", "content": user_content})
    return messages
