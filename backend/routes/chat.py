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

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def fetch_url_content(url: str) -> str:
    """Fetch and extract text from a URL."""
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


@router.post("/stream")
async def chat_stream(
    conversation_id: str = Form(...),
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
    model: Optional[str] = Form(None),
    temperature: Optional[float] = Form(None),
    x_user_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    user_id = x_user_id or "anonymous"

    # Guest kullanıcılar için DB'ye erişim yok, direkt işle
    if user_id == "guest":
        # Process file
        file_content = None
        file_name = None
        if file and file.filename:
            file_bytes = await file.read()
            file_name = file.filename
            raw = process_file(file_name, file_bytes)
            file_content = truncate_content(raw)

        # Auto-detect URL in message
        url_content = None
        urls = re.findall(r'https?://[^\s]+', message)
        if urls:
            url_content = await fetch_url_content(urls[0])

        extra = ""
        if file_content:
            extra += f"\n\n📎 **Dosya ({file_name}):**\n{file_content}"
        if url_content:
            extra += f"\n\n🔗 **URL İçeriği:**\n{url_content}"

        api_messages = build_messages_for_api([], message, extra if extra else None)

        async def generate_guest():
            full_response = ""
            try:
                async for token in get_ai_response_stream(api_messages, model=model, temperature=temperature):
                    full_response += token
                    yield f"data: {json.dumps({'token': token})}\n\n"
                yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"
            except Exception as e:
                print(f"GUEST STREAM ERROR:\n{traceback.format_exc()}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(generate_guest(), media_type="text/event-stream",
                                  headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    conv = await db_storage.get_conversation(db, conversation_id, user_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")

    # Process file
    file_content = None
    file_name = None
    if file and file.filename:
        file_bytes = await file.read()
        file_name = file.filename
        raw = process_file(file_name, file_bytes)
        file_content = truncate_content(raw)

    # Auto-detect URL in message
    url_content = None
    urls = re.findall(r'https?://[^\s]+', message)
    if urls:
        url_content = await fetch_url_content(urls[0])

    # Combine extra context
    extra = ""
    if file_content:
        extra += f"\n\n📎 **Dosya ({file_name}):**\n{file_content}"
    if url_content:
        extra += f"\n\n🔗 **URL İçeriği:**\n{url_content}"

    # Save user message (skip for guests)
    if user_id != "guest":
        await db_storage.add_message(db, conversation_id, "user", message, file_name, user_id=user_id)

    # Reload conv with messages and get user preferences
    conv = await db_storage.get_conversation(db, conversation_id, user_id)
    history = conv["messages"][:-1] if user_id != "guest" else []
    api_messages = build_messages_for_api(history, message, extra if extra else None)
    # Get User settings
    prefs = None
    mods = None
    if user_id != "guest":
        from database import User
        user_model = await db.get(User, user_id)
        if user_model:
            prefs = json.loads(user_model.preferences) if user_model.preferences else None
            mods = json.loads(user_model.modules) if user_model.modules else None

    async def generate():
        full_response = ""
        try:
            async for token in get_ai_response_stream(api_messages, model=model, temperature=temperature, preferences=prefs, modules=mods):
                full_response += token
                yield f"data: {json.dumps({'token': token})}\n\n"

            # Don't save to DB for guest users
            if user_id != "guest":
                await db_storage.add_message(db, conversation_id, "assistant", full_response,
                                              model_used=model, user_id=user_id)
            yield f"data: {json.dumps({'done': True, 'conversation_id': conversation_id})}\n\n"

        except Exception as e:
            print(f"STREAM ERROR:\n{traceback.format_exc()}")
            err = f"Hata: {str(e)}"
            if user_id != "guest":
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
    """Generate a short conversation title from the first message."""
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
    """Run the same prompt through two models and return both responses."""
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
    fast: bool = False  # True ise flux-schnell kullan (daha hızlı ama biraz daha düşük kalite)


def get_image_dimensions(prompt: str) -> tuple[int, int]:
    """Prompt içeriğine göre en uygun boyutu seç."""
    p = prompt.lower()

    # Dikey / portre
    if any(w in p for w in [
        'portrait', 'face', 'person', 'woman', 'man', 'girl', 'boy',
        'character', 'selfie', 'nude', 'naked', 'sexy', 'seductive',
        'model', 'anime girl', 'anime boy', 'full body', 'standing',
        'lingerie', 'bikini', 'pinup', 'pin-up'
    ]):
        return 832, 1216

    # Yatay / manzara
    if any(w in p for w in [
        'landscape', 'panorama', 'wide', 'city', 'cityscape', 'nature',
        'mountain', 'ocean', 'sea', 'sky', 'sunset', 'sunrise', 'forest',
        'field', 'valley', 'horizon', 'scenery', 'environment'
    ]):
        return 1344, 768

    # Ultra geniş
    if any(w in p for w in ['wallpaper', 'desktop', 'banner', 'cover', 'cinematic', 'widescreen']):
        return 1536, 640

    # Kare
    if any(w in p for w in ['logo', 'icon', 'product', 'square', 'symbol', 'badge', 'emblem']):
        return 1024, 1024

    # Varsayılan — hafif geniş
    return 1152, 896


def is_adult_content(prompt: str) -> bool:
    """NSFW içerik tespiti."""
    adult_keywords = [
        'nude', 'naked', 'nsfw', 'explicit', 'erotic', 'sexy', 'seductive',
        'lingerie', 'topless', 'adult', 'mature', 'sensual', 'intimate',
        'revealing', 'undressed', 'bare', 'provocative', 'risque',
        'bikini', 'underwear', 'bra', 'panties', 'cleavage', 'breasts',
        'ass', 'butt', 'hentai', 'ecchi', 'lewd', 'naughty', 'hot woman',
        'hot girl', 'hot man', 'shirtless', 'half naked', 'pinup', 'pin-up',
        'alluring', 'sultry', 'voluptuous', 'busty'
    ]
    p = prompt.lower()
    return any(w in p for w in adult_keywords)


def build_final_prompt(prompt: str) -> str:
    """
    Prompt'u kalite açısından güçlendir.
    LLM zaten detaylı prompt üretiyor, sadece eksik kalite tag'larını ekle.
    """
    p = prompt.lower()
    additions = []

    # Kalite tag'ları yoksa ekle
    quality_tags = ['8k', '4k', 'uhd', 'ultra detailed', 'high quality', 'detailed', 'masterpiece']
    if not any(t in p for t in quality_tags):
        additions.append("ultra detailed, high quality")

    # Işık yoksa ekle
    lighting_tags = ['lighting', 'light', 'shadow', 'illuminat', 'glow', 'ray', 'hdr']
    if not any(t in p for t in lighting_tags):
        additions.append("professional lighting")

    if additions:
        return prompt + ", " + ", ".join(additions)
    return prompt


@router.post("/generate-image")
async def generate_image(req: ImageGenRequest):
    """
    Pollinations AI ile görsel üret.
    Resmi backend üzerinden proxy'le — CORS ve timeout sorunlarını önler.
    """
    try:
        is_nsfw = is_adult_content(req.prompt)

        # Boyut belirle
        if req.width != 1024 or req.height != 1024:
            width, height = req.width, req.height
        else:
            width, height = get_image_dimensions(req.prompt)

        # Prompt'u güçlendir
        final_prompt = build_final_prompt(req.prompt)
        encoded_prompt = quote(final_prompt)
        seed = random.randint(1, 999999)

        if is_nsfw:
            image_model = "flux-realism"
            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width={width}&height={height}&model={image_model}"
                f"&nologo=true&enhance=false&seed={seed}&safe=false"
            )
        elif req.fast:
            image_model = "flux-schnell"
            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width={width}&height={height}&model={image_model}"
                f"&nologo=true&enhance=false&seed={seed}"
            )
        else:
            image_model = "flux"
            pollinations_url = (
                f"https://image.pollinations.ai/prompt/{encoded_prompt}"
                f"?width={width}&height={height}&model={image_model}"
                f"&nologo=true&enhance=false&seed={seed}"
            )

        # Resmi backend üzerinden çek — CORS sorununu önler
        # Pollinations resim üretmek için 10-60 sn alabilir, timeout yüksek tut
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            resp = await client.get(
                pollinations_url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; KiraAI/1.0)"}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Pollinations hata döndürdü: {resp.status_code}")

            content_type = resp.headers.get("content-type", "image/jpeg")
            image_bytes = resp.content

        # Base64'e çevir — frontend direkt gösterebilir, CORS yok
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:{content_type};base64,{b64}"

        return {"image_url": data_url, "prompt": req.prompt}

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Görsel oluşturma zaman aşımına uğradı. Tekrar deneyin.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
