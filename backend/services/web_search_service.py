"""
Web Arama Servisi — Kira'nın güncel bilgiye erişimi.

DuckDuckGo Instant Answer API kullanır (ücretsiz, API key gerektirmez).
Gerektiğinde sayfa içeriği de çekilir.

Akış:
1. needs_web_search() → mesajın web araması gerektirip gerektirmediğini hızlıca kontrol eder
2. search_web()       → DuckDuckGo'dan arama yapar, en iyi sonuçları döndürür
3. fetch_page()       → Bir URL'nin içeriğini çeker ve temizler
4. build_search_context() → Tüm sonuçları AI'ya verilecek context metnine dönüştürür
"""

import httpx
import re
import json
from typing import List, Optional
from urllib.parse import quote_plus, urlparse
from bs4 import BeautifulSoup


# Web araması gerektiren anahtar kelimeler / kalıplar
SEARCH_TRIGGERS = [
    # Güncellik — tarih/zaman içeren sorular
    r'\b(bugünkü|dünkü|bu haftaki|bu ayki|bu yılki|şu anki|güncel|son dakika|breaking)\b',
    r'\b(today\'s|yesterday\'s|this week\'s|current|latest|breaking news|recent)\b',
    # Fiyat / kur / borsa
    r'\b(fiyat|ücret|kaç lira|kaç dolar|kaç euro|döviz kuru|dolar kaç|euro kaç|altın fiyat|hisse|borsa|bitcoin|kripto)\b',
    r'\b(price|cost|how much|exchange rate|stock price|bitcoin price|crypto)\b',
    # Hava durumu
    r'\b(hava durumu|hava nasıl|sıcaklık kaç|yağmur yağacak mı)\b',
    r'\b(weather|temperature|forecast|will it rain)\b',
    # Spor sonuçları
    r'\b(maç sonucu|skor|puan tablosu|lig sıralaması|şampiyon kim)\b',
    r'\b(match result|score|standings|league table|who won)\b',
    # Haber / son gelişme
    r'\b(son haberler|son gelişme|ne oldu|neler oluyor|gündem)\b',
    r'\b(latest news|what happened|current events|breaking)\b',
    # Ürün / teknoloji çıkış tarihi
    r'\b(ne zaman çıktı|ne zaman çıkacak|yeni sürüm|son sürüm|güncel sürüm)\b',
    r'\b(release date|when did .* come out|latest version|new version)\b',
    # Açık araştırma isteği
    r'\b(araştır|araştırır mısın|bul|search for|look up|find out)\b',
]

# Bu konular web araması gerektirmez — kesinlikle arama yapma
NO_SEARCH_PATTERNS = [
    # Kod yazma / üretim görevleri
    r'\b(kod yaz|yaz bana|oluştur|üret|çiz|anlat|açıkla|özetle|çevir|düzelt|yardım et)\b',
    r'\b(write code|create|generate|draw|explain|summarize|translate|fix|help me)\b',
    # Görsel oluşturma
    r'\[IMAGE_GEN',
    r'\b(resim yap|görsel oluştur|çizim yap|fotoğraf)\b',
    # Sohbet / kişisel sorular
    r'\b(nasılsın|ne yapıyorsun|naber|selam|merhaba|iyi misin|ne düşünüyorsun|fikrin ne|bence|sence)\b',
    r'\b(how are you|what do you think|your opinion|do you like|tell me about yourself)\b',
    # Matematik / mantık
    r'\b(hesapla|kaç eder|çarp|böl|topla|çıkar|integral|türev|denklem)\b',
    r'\b(calculate|compute|solve|equation|derivative|integral)\b',
    # Tarih / genel bilgi (güncel değil)
    r'\b(tarihte|tarihçe|kim icat etti|ne zaman icat|hangi yılda|kim kurdu)\b',
]

# Güvenilir kaynak domainleri (öncelikli)
TRUSTED_DOMAINS = [
    'wikipedia.org', 'britannica.com', 'reuters.com', 'bbc.com', 'bbc.co.uk',
    'nytimes.com', 'theguardian.com', 'techcrunch.com', 'github.com',
    'stackoverflow.com', 'docs.python.org', 'developer.mozilla.org',
    'hurriyet.com.tr', 'milliyet.com.tr', 'sabah.com.tr', 'ntv.com.tr',
    'haberturk.com', 'sozcu.com.tr', 'cumhuriyet.com.tr',
    'investing.com', 'finance.yahoo.com', 'bloomberg.com',
]

# Atlanacak domainler
SKIP_DOMAINS = [
    'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
    'youtube.com', 'reddit.com', 'pinterest.com', 'linkedin.com',
]


def needs_web_search(message: str) -> bool:
    """Mesajın web araması gerektirip gerektirmediğini kontrol et."""
    msg_lower = message.lower().strip()

    # Çok kısa mesajlar — arama yapma
    if len(msg_lower) < 8:
        return False

    # Önce "arama gerektirmez" kalıplarını kontrol et — bunlar varsa kesinlikle arama yapma
    for pattern in NO_SEARCH_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return False

    # Arama tetikleyicilerini kontrol et
    for pattern in SEARCH_TRIGGERS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return True

    return False


async def search_web(query: str, max_results: int = 5) -> List[dict]:
    """
    DuckDuckGo üzerinden arama yap.
    Sonuçları [{title, url, snippet}] formatında döndür.
    """
    results = []

    try:
        # DuckDuckGo HTML arama (en güvenilir yöntem)
        encoded = quote_plus(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded}"

        async with httpx.AsyncClient(
            timeout=10,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            }
        ) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return []

        soup = BeautifulSoup(resp.text, "html.parser")

        for result in soup.select(".result"):
            title_el = result.select_one(".result__title a")
            snippet_el = result.select_one(".result__snippet")

            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            href = title_el.get("href", "")

            # DuckDuckGo redirect URL'ini temizle
            real_url = _extract_real_url(href)
            if not real_url:
                continue

            # Atlanacak domainleri geç
            domain = urlparse(real_url).netloc.replace("www.", "")
            if any(skip in domain for skip in SKIP_DOMAINS):
                continue

            snippet = snippet_el.get_text(strip=True) if snippet_el else ""

            results.append({
                "title": title,
                "url": real_url,
                "snippet": snippet,
                "domain": domain,
                "trusted": any(td in domain for td in TRUSTED_DOMAINS),
            })

            if len(results) >= max_results:
                break

    except Exception as e:
        print(f"[WebSearch] DuckDuckGo hatası: {e}")

    # Güvenilir kaynakları öne al
    results.sort(key=lambda x: (0 if x["trusted"] else 1))
    return results


def _extract_real_url(href: str) -> Optional[str]:
    """DuckDuckGo redirect URL'inden gerçek URL'i çıkar."""
    if not href:
        return None
    if href.startswith("http"):
        return href
    # /l/?uddg=... formatı
    match = re.search(r'uddg=([^&]+)', href)
    if match:
        from urllib.parse import unquote
        return unquote(match.group(1))
    return None


async def fetch_page_content(url: str, max_chars: int = 3000) -> Optional[str]:
    """
    Bir sayfanın içeriğini çek ve temizle.
    Hata olursa None döner.
    """
    try:
        async with httpx.AsyncClient(
            timeout=8,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; KiraAI/1.0)"}
        ) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # Gereksiz elementleri kaldır
        for tag in soup(["script", "style", "nav", "footer", "header",
                          "aside", "advertisement", "iframe", "noscript"]):
            tag.decompose()

        # Ana içeriği bul
        main = (
            soup.find("article") or
            soup.find("main") or
            soup.find(id=re.compile(r'content|article|main', re.I)) or
            soup.find(class_=re.compile(r'content|article|main|post', re.I)) or
            soup.body
        )

        if not main:
            return None

        text = main.get_text(separator="\n", strip=True)
        lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 40]
        content = "\n".join(lines)

        return content[:max_chars] if len(content) > max_chars else content

    except Exception:
        return None


async def build_search_context(query: str, fetch_top_page: bool = True) -> str:
    """
    Arama yap, sonuçları topla ve AI'ya verilecek context metnini oluştur.

    fetch_top_page=True ise en iyi sonucun sayfa içeriği de çekilir.
    """
    results = await search_web(query, max_results=5)

    if not results:
        return ""

    lines = [f"## 🔍 Web Arama Sonuçları: \"{query}\"\n"]

    for i, r in enumerate(results, 1):
        lines.append(f"**{i}. {r['title']}**")
        lines.append(f"🔗 {r['url']}")
        if r['snippet']:
            lines.append(f"📝 {r['snippet']}")
        lines.append("")

    # En iyi sonucun tam içeriğini çek
    if fetch_top_page and results:
        top = results[0]
        content = await fetch_page_content(top["url"])
        if content:
            lines.append(f"---\n### 📄 Detaylı İçerik ({top['domain']}):\n")
            lines.append(content[:2500])
            lines.append("")

    lines.append("---")
    lines.append("⚠️ Yukarıdaki bilgileri kullanarak yanıt ver. Kaynakları belirt.")

    return "\n".join(lines)
