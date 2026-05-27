from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db
from routes import conversations, chat, admin
import os
from dotenv import load_dotenv

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Kira AI API", version="3.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm originlere izin ver (LAN erişimi için)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from services.auth import auth_middleware
from starlette.middleware.base import BaseHTTPMiddleware
app.add_middleware(BaseHTTPMiddleware, dispatch=auth_middleware)

app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health():
    key = os.getenv("GROQ_API_KEY", "")
    return {"status": "ok", "version": "3.0.0", "groq_key_set": bool(key)}


@app.get("/api/models")
async def get_models():
    """
    Groq API'den aktif modelleri çek.
    Hata olursa sabit güvenli listeyi döndür.
    """
    # Sabit güvenli liste — sadece aktif olduğu doğrulanmış modeller
    safe_models = [
        {"id": "llama-3.3-70b-versatile",     "name": "Llama 3.3 70B — En İyi"},
        {"id": "llama-3.1-8b-instant",         "name": "Llama 3.1 8B — En Hızlı"},
        {"id": "llama-3.2-90b-vision-preview", "name": "Llama 3.2 90B Vision — Görsel"},
        {"id": "llama-3.2-11b-vision-preview", "name": "Llama 3.2 11B Vision"},
        {"id": "deepseek-r1-distill-llama-70b","name": "DeepSeek R1 — Akıl Yürütme"},
    ]

    # Groq API'den aktif modelleri çekmeyi dene
    try:
        import httpx
        groq_key = os.getenv("GROQ_API_KEY", "")
        if groq_key:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {groq_key}"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    active_ids = {m["id"] for m in data.get("data", [])}
                    # Sadece aktif olan modelleri döndür
                    filtered = [m for m in safe_models if m["id"] in active_ids]
                    if filtered:
                        return {"models": filtered}
    except Exception:
        pass  # Hata olursa sabit listeyi kullan

    return {"models": safe_models}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))  # Railway PORT env variable'ını kullan
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
