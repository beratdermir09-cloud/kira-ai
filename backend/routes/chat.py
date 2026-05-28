from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json, traceback, httpx, re, random, base64
from bs4 import BeautifulSoup
from pydantic import BaseModel
from urllib.parse import quote

from database import get_db
from services import db_storage
from services.ai_service import get_ai_response_stream, build_messages_for_api
from services.file_processor import process_file, truncate_content
from services.web_search_service import needs_web_search, build_search_context

router = APIRouter(prefix="/api/chat", tags=["chat"])

VISION_MODELS = {
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'llama-3.2-90b-vision-preview',
    'llama-3.2-11b-vision-preview',
}
IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
MEDIA_MAP = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp'
}


async def fetch_url_content(url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(resp.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            lines = [l for l in text.splitlines() if len(l.strip()) > 30]
            return "\n".join(lines[:200])
    except Exception as e:
        return f"URL okunamadı: {str(e)}"


def process_uploaded_file(file_bytes: bytes, file_name: str, model: Optional[str]):
    """
    Yüklenen dosyayı işle.
    Resimse base64 + vision model döndür.
    Dökümanssa metin içeriği döndür.
    """
    ext = file_name.lower().rsplit('.', 1)[-1] if '.' in file_name else ''

    if ext in IMAGE_EXTENSIONS:
        img_b64 = base64.b64encode(file_bytes).decode('utf-8')
        media_type = MEDIA_MAP.get(ext, 'image/jpeg')
        # Vision model yoksa en iyi vision modeli seç
        vision_model = model if model in VISION_MODELS else 'meta-llama/llama-4-scout-17b-16e-instruct'
        return None, img_b64, media_type, vision_model
    else:
        raw = process_file(file_name, file_bytes)
        # Döküman için vision model seçilmişse normal modele geç
        safe_model = model if model not in VISION_MODELS else 'llama-3.3-70b-versatile'
        return truncate_content(raw), None, None, safe_model


@router.post("/stream")
async def chat_stream(
    conversation_id: str = Form(...),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
    model: Optional[str] = Form(None),
    temperature: Optional[float] = Form(None),
    personality: Optional[str] = Form(None),
    x_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    user_id = x_user_id or "anonymous"

    # Dosya işle
    file_content = None
    file_name = None
    image_base64 = None
    image_media_type = "image/jpeg"

    if file and file.filename:
        file_bytes = await file.read()
        file_name = file.filename
        file_content, image_base64, image_media_type, model = process_uploaded_file(
            file_bytes, file_name, model
        )
        if image_media_type is None:
            image_media_type = "image/jpeg"

    # URL tespiti
    url_content = None
    urls = re.findall(r'https?://[^\s]+', message)
    if urls:
        url_content = await fetch_url_content(urls[0])

    # Web araması — URL yoksa ve arama gerekiyorsa
    web_search_context = None
    if not urls and not (file and file.filename):
        if needs_web_search(message):
            try:
                web_search_context = await build_search_context(message)
            except Exception:
                pass  # Arama hatası akışı bozmasın

    # Dosya yokken vision model seçilmişse normal modele geç
    if not image_base64 and model in VISION_MODELS:
        model = 'llama-3.3-70b-versatile'

    extra = ""
    if file_content:
        ext = file_name.lower().rsplit('.', 1)[-1] if file_name and '.' in file_name else ''
        # Dosya türüne göre AI'ya analiz talimatı ver
        if ext == 'pdf':
            file_label = f"📄 PDF Dosyası: {file_name}"
            file_instruction = "Aşağıdaki PDF içeriğini analiz et. Kullanıcının sorusuna göre özetle, açıkla veya yanıtla."
        elif ext in ('docx', 'doc'):
            file_label = f"📝 Word Belgesi: {file_name}"
            file_instruction = "Aşağıdaki Word belgesi içeriğini analiz et. Kullanıcının sorusuna göre yanıtla."
        elif ext in ('xlsx', 'xls'):
            file_label = f"📊 Excel Dosyası: {file_name}"
            file_instruction = "Aşağıdaki Excel verilerini analiz et. Tablo yapısını anla, istatistikler çıkar, kullanıcının sorusunu yanıtla."
        elif ext == 'csv':
            file_label = f"📊 CSV Verisi: {file_name}"
            file_instruction = "Aşağıdaki CSV verisini analiz et. Sütunları, satır sayısını ve içeriği değerlendir."
        elif ext == 'json':
            file_label = f"🔧 JSON Verisi: {file_name}"
            file_instruction = "Aşağıdaki JSON verisini analiz et. Yapıyı açıkla ve kullanıcının sorusunu yanıtla."
        elif ext in ('py', 'js', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sh'):
            file_label = f"� Kod Dosyası: {file_name}"
            file_instruction = "Aşağıdaki kodu analiz et. Kullanıcının sorusuna göre açıkla, hata bul veya iyileştir."
        elif ext in ('html', 'css', 'xml', 'yaml', 'yml', 'toml', 'ini'):
            file_label = f"🔧 Yapılandırma/Markup: {file_name}"
            file_instruction = "Aşağıdaki dosyayı analiz et ve kullanıcının sorusunu yanıtla."
        elif ext in ('txt', 'md'):
            file_label = f"📃 Metin Dosyası: {file_name}"
            file_instruction = "Aşağıdaki metin içeriğini analiz et ve kullanıcının sorusunu yanıtla."
        else:
            file_label = f"📎 Dosya: {file_name}"
            file_instruction = "Aşağıdaki dosya içeriğini analiz et ve kullanıcının sorusunu yanıtla."

        extra += f"\n\n{file_instruction}\n\n**{file_label}:**\n```\n{file_content}\n```"

    if url_content:
        extra += f"\n\n🔗 **URL İçeriği:**\n{url_content}"

    if web_search_context:
        extra += f"\n\n{web_search_context}"

    # ── GUEST ──────────────────────────────────────────────────
    if user_id == "guest":
        api_messages = build_messages_for_api(
            [], message, extra if extra else None,
            image_base64=image_base64, image_media_type=image_media_type
        )

        async def generate_guest():
            try:
                # Guest: hafıza YOK, kişilik de YOK — sadece temel Kira
                async for token in get_ai_response_stream(api_messages, model=model, temperature=temperature):
                    yield f"data: {json.dumps({'token': token})}\n\n"
                yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"
            except Exception as e:
                print(f"GUEST STREAM ERROR:\n{traceback.format_exc()}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(generate_guest(), media_type="text/event-stream",
                                  headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # ── KAYITLI KULLANICI ───────────────────────────────────────
    conv = await db_storage.get_conversation(db, conversation_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    await db_storage.add_message(db, conversation_id, "user", message, file_name, user_id=user_id)

    conv = await db_storage.get_conversation(db, conversation_id, user_id)
    history = conv["messages"][:-1]

    api_messages = build_messages_for_api(
        history, message, extra if extra else None,
        image_base64=image_base64, image_media_type=image_media_type
    )

    prefs = None
    mods = None
    display_name = None
    from database import User as DBUser
    user_model = await db.get(DBUser, user_id)
    if user_model:
        prefs = json.loads(user_model.preferences) if user_model.preferences else None
        mods = json.loads(user_model.modules) if user_model.modules else None
        display_name = user_model.display_name

    # Uzun süreli hafızayı yükle
    user_memory = await db_storage.get_user_memory(db, user_id)

    async def generate():
        full_response = ""
        try:
            async for token in get_ai_response_stream(
                api_messages, model=model, temperature=temperature,
                preferences=prefs, modules=mods,
                memory=user_memory, display_name=display_name,
                personality=personality,
            ):
                full_response += token
                yield f"data: {json.dumps({'token': token})}\n\n"

            await db_storage.add_message(db, conversation_id, "assistant", full_response,
                                          model_used=model, user_id=user_id)

            # Konuşmadan yeni bilgi çıkar ve hafızayı güncelle (arka planda)
            try:
                from services.memory_service import extract_and_update_memory
                updated_memory = await extract_and_update_memory(
                    current_memory=user_memory,
                    user_message=message,
                    assistant_response=full_response,
                    display_name=display_name,
                )
                if updated_memory:
                    await db_storage.update_user_memory(db, user_id, updated_memory)
            except Exception:
                pass  # Hafıza güncelleme hatası akışı bozmasın

            yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"

        except Exception as e:
            print(f"STREAM ERROR:\n{traceback.format_exc()}")
            err = f"Hata: {str(e)}"
            await db_storage.add_message(db, conversation_id, "assistant", err, user_id=user_id)
            yield f"data: {json.dumps({'error': err})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                              headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/messages/{message_id}/pin")
async def pin_message(message_id: str, x_user_id: Optional[str] = Header(None),
                      db: AsyncSession = Depends(get_db)):
    pinned = await db_storage.pin_message(db, message_id, x_user_id or "anonymous")
    return {"is_pinned": pinned}


class TitleGenRequest(BaseModel):
    message: str


class CompareRequest(BaseModel):
    prompt: str
    model_a: str = "llama-3.3-70b-versatile"
    model_b: str = "llama-3.1-8b-instant"


@router.post("/generate-title")
async def generate_title(req: TitleGenRequest):
    try:
        from services.ai_service import get_ai_response
        prompt = f"Bu mesaj için 4-6 kelimelik kısa ve öz bir sohbet başlığı üret. Sadece başlığı yaz, başka hiçbir şey yazma:\n\n{req.message[:300]}"
        title = await get_ai_response([{"role": "user", "content": prompt}], model="llama-3.1-8b-instant", temperature=0.3)
        title = title.strip().strip('"').strip("'")[:60]
        return {"title": title}
    except Exception as e:
        return {"title": req.message[:40] + ("..." if len(req.message) > 40 else "")}


@router.post("/compare")
async def compare_models(req: CompareRequest):
    try:
        from services.ai_service import get_ai_response
        import asyncio
        messages = [{"role": "user", "content": req.prompt}]
        resp_a, resp_b = await asyncio.gather(
            get_ai_response(messages, model=req.model_a, temperature=0.7),
            get_ai_response(messages, model=req.model_b, temperature=0.7),
        )
        return {"responseA": resp_a, "responseB": resp_b}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ImageGenRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    model: str = "flux"
    fast: bool = False


def get_image_dimensions(prompt: str) -> tuple[int, int]:
    p = prompt.lower()
    if any(w in p for w in ['portrait', 'face', 'person', 'woman', 'man', 'girl', 'boy',
        'character', 'selfie', 'nude', 'naked', 'sexy', 'seductive',
        'model', 'anime girl', 'anime boy', 'full body', 'standing', 'lingerie', 'bikini']):
        return 832, 1216
    if any(w in p for w in ['landscape', 'panorama', 'wide', 'city', 'cityscape', 'nature',
        'mountain', 'ocean', 'sea', 'sky', 'sunset', 'sunrise', 'forest', 'field', 'valley']):
        return 1344, 768
    if any(w in p for w in ['wallpaper', 'desktop', 'banner', 'cover', 'cinematic', 'widescreen']):
        return 1536, 640
    if any(w in p for w in ['logo', 'icon', 'product', 'square', 'symbol', 'badge', 'emblem']):
        return 1024, 1024
    return 1152, 896


def is_adult_content(prompt: str) -> bool:
    adult_keywords = ['nude', 'naked', 'nsfw', 'explicit', 'erotic', 'sexy', 'seductive',
        'lingerie', 'topless', 'adult', 'mature', 'sensual', 'intimate', 'revealing',
        'undressed', 'bare', 'provocative', 'bikini', 'underwear', 'bra', 'panties',
        'cleavage', 'breasts', 'ass', 'butt', 'hentai', 'ecchi', 'lewd', 'naughty',
        'alluring', 'sultry', 'voluptuous', 'busty', 'pinup', 'pin-up']
    return any(w in prompt.lower() for w in adult_keywords)


def build_final_prompt(prompt: str) -> str:
    p = prompt.lower()
    additions = []
    if not any(t in p for t in ['8k', '4k', 'uhd', 'ultra detailed', 'high quality', 'detailed', 'masterpiece']):
        additions.append("ultra detailed, high quality")
    if not any(t in p for t in ['lighting', 'light', 'shadow', 'illuminat', 'glow', 'ray', 'hdr']):
        additions.append("professional lighting")
    return prompt + (", " + ", ".join(additions) if additions else "")


@router.post("/generate-image")
async def generate_image(req: ImageGenRequest):
    try:
        is_nsfw = is_adult_content(req.prompt)
        width, height = (req.width, req.height) if (req.width != 1024 or req.height != 1024) else get_image_dimensions(req.prompt)
        final_prompt = build_final_prompt(req.prompt)
        encoded_prompt = quote(final_prompt)
        seed = random.randint(1, 999999)

        if is_nsfw:
            image_model = "flux-realism"
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&model={image_model}&nologo=true&enhance=false&seed={seed}&safe=false"
        elif req.fast:
            image_model = "flux-schnell"
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&model={image_model}&nologo=true&enhance=false&seed={seed}"
        else:
            image_model = "flux"
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&model={image_model}&nologo=true&enhance=false&seed={seed}"

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; KiraAI/1.0)"})
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Pollinations hata: {resp.status_code}")
            content_type = resp.headers.get("content-type", "image/jpeg")
            b64 = base64.b64encode(resp.content).decode("utf-8")

        return {"image_url": f"data:{content_type};base64,{b64}", "prompt": req.prompt}

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Görsel oluşturma zaman aşımına uğradı.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
