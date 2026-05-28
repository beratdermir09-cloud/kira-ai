"""
Uzun süreli hafıza servisi.

Kullanıcı hakkında öğrenilen bilgileri (isim, ilgi alanları, meslek, tercihler vb.)
veritabanında saklar ve her konuşmada Kira'nın system prompt'una enjekte eder.

Hafıza yapısı (JSON):
{
  "name": "Yasin",
  "nickname": "Yas",
  "occupation": "yazılım geliştirici",
  "interests": ["Python", "oyun", "müzik"],
  "location": "İstanbul",
  "language_style": "samimi",
  "important_facts": ["köpeği var", "sabah kahvesi içer"],
  "last_updated": "2025-05-27T10:00:00"
}
"""

import json
import re
from typing import Optional
from groq import AsyncGroq
import os

_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

# Hafızadan çıkarılacak bilgi kategorileri
MEMORY_EXTRACT_PROMPT = """Aşağıdaki konuşmadan kullanıcı hakkında öğrenilen KİŞİSEL BİLGİLERİ çıkar.

Mevcut hafıza:
{current_memory}

Yeni konuşma:
{conversation}

Sadece GERÇEKTEN söylenmiş, kesin bilgileri çıkar. Tahmin etme.
Çıkarılabilecek bilgiler: isim/takma ad, meslek, yaşadığı yer, ilgi alanları, hobiler, önemli kişisel detaylar, dil/üslup tercihi.

Yanıtı SADECE JSON olarak ver, başka hiçbir şey yazma:
{{
  "name": "varsa isim, yoksa null",
  "nickname": "varsa takma ad, yoksa null",
  "occupation": "varsa meslek, yoksa null",
  "location": "varsa şehir/ülke, yoksa null",
  "interests": ["ilgi alanı listesi, boşsa []"],
  "important_facts": ["önemli kişisel detaylar, boşsa []"],
  "language_style": "samimi/resmi/teknik, yoksa null"
}}"""


def build_memory_context(memory: dict, display_name: str = None) -> str:
    """Hafızayı system prompt'a eklenecek metin olarak formatla."""
    if not memory and not display_name:
        return ""

    lines = []

    # İsim — hafızadan veya Firebase display_name'den
    name = memory.get("name") or (display_name.split()[0] if display_name else None)
    nickname = memory.get("nickname")

    if nickname:
        lines.append(
            f"- Kullanıcının adı: {name or display_name}, takma adı: {nickname}. "
            f"Ona MUTLAKA '{nickname}' diye seslen — her konuşmada değil, doğal hissettiren anlarda."
        )
    elif name:
        lines.append(
            f"- Kullanıcının adı: {name}. "
            f"Onu zaman zaman ismiyle çağır — selamlama, teşekkür veya önemli bir noktada doğal hissettiren anlarda."
        )
    elif display_name:
        first = display_name.split()[0]
        lines.append(
            f"- Kullanıcının adı: {first}. "
            f"Onu zaman zaman '{first}' diye çağır — doğal ve samimi hissettiren anlarda."
        )

    if memory.get("occupation"):
        lines.append(f"- Mesleği: {memory['occupation']}")

    if memory.get("location"):
        lines.append(f"- Yaşadığı yer: {memory['location']}")

    if memory.get("interests"):
        lines.append(f"- İlgi alanları: {', '.join(memory['interests'])}")

    if memory.get("important_facts"):
        lines.append(f"- Önemli detaylar: {'; '.join(memory['important_facts'])}")

    if memory.get("language_style"):
        style_map = {
            "samimi": "Kullanıcı samimi bir üslup tercih ediyor, sen de öyle konuş.",
            "resmi": "Kullanıcı resmi bir üslup tercih ediyor.",
            "teknik": "Kullanıcı teknik detayları seviyor, doğrudan ve teknik konuş.",
        }
        style = style_map.get(memory.get("language_style", ""), "")
        if style:
            lines.append(f"- {style}")

    if not lines:
        return ""

    return "## KULLANICI HAFIZASI (Bunları bil ve kullan):\n" + "\n".join(lines)


async def extract_and_update_memory(
    current_memory: dict,
    user_message: str,
    assistant_response: str,
    display_name: str = None
) -> Optional[dict]:
    """
    Konuşmadan yeni bilgi çıkar, mevcut hafızayla birleştir.
    Değişiklik yoksa None döner.
    """
    # Kısa mesajlarda hafıza çıkarmaya gerek yok
    if len(user_message) < 10:
        return None

    # Kişisel bilgi içerip içermediğini hızlıca kontrol et
    personal_keywords = [
        "benim", "ben ", "adım", "ismim", "çalışıyorum", "yaşıyorum",
        "seviyorum", "hobim", "işim", "mesleğim", "öğrenciyim", "geliyorum",
        "my name", "i am", "i work", "i live", "i love", "i'm",
    ]
    combined = (user_message + " " + assistant_response).lower()
    if not any(kw in combined for kw in personal_keywords):
        return None

    try:
        current_str = json.dumps(current_memory, ensure_ascii=False) if current_memory else "{}"
        conversation = f"Kullanıcı: {user_message}\nKira: {assistant_response[:500]}"

        prompt = MEMORY_EXTRACT_PROMPT.format(
            current_memory=current_str,
            conversation=conversation
        )

        response = await _client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Hafif model — hızlı ve ucuz
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.1,
        )

        raw = response.choices[0].message.content.strip()

        # JSON bloğunu çıkar
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            return None

        extracted = json.loads(json_match.group())

        # Mevcut hafızayla birleştir — null değerleri atla, listeleri merge et
        updated = dict(current_memory)

        for key in ("name", "nickname", "occupation", "location", "language_style"):
            val = extracted.get(key)
            if val and val != "null":
                updated[key] = val

        # İlgi alanlarını birleştir (tekrar etme)
        new_interests = [i for i in extracted.get("interests", []) if i]
        if new_interests:
            existing = updated.get("interests", [])
            merged = list(dict.fromkeys(existing + new_interests))  # sıra koruyarak unique
            updated["interests"] = merged[:15]  # max 15

        # Önemli detayları birleştir
        new_facts = [f for f in extracted.get("important_facts", []) if f]
        if new_facts:
            existing = updated.get("important_facts", [])
            merged = list(dict.fromkeys(existing + new_facts))
            updated["important_facts"] = merged[:10]  # max 10

        # Değişiklik var mı?
        if updated == current_memory:
            return None

        from datetime import datetime
        updated["last_updated"] = datetime.now().isoformat()
        return updated

    except Exception:
        return None
