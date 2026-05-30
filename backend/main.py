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

# CORS — BaseHTTPMiddleware ile çakışmaması için tek middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# NOT: auth_middleware kaldırıldı — BaseHTTPMiddleware CORS header'larını bozuyordu.
# Her route kendi auth kontrolünü yapıyor (x-user-id header veya check_admin dependency).

app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health():
    key = os.getenv("GROQ_API_KEY", "")
    return {"status": "ok", "version": "3.0.0", "groq_key_set": bool(key)}


@app.get("/api/models")
async def get_models():
    return {"models": [
        {"id": "llama-3.3-70b-versatile",                          "name": "Llama 3.3 70B — En İyi"},
        {"id": "meta-llama/llama-4-maverick-17b-128e-instruct",    "name": "Llama 4 Maverick — Çok Dilli"},
        {"id": "meta-llama/llama-4-scout-17b-16e-instruct",        "name": "Llama 4 Scout — Vision"},
        {"id": "moonshotai/kimi-k2-instruct-0905",                 "name": "Kimi K2 — Akıllı"},
        {"id": "qwen/qwen3-32b",                                   "name": "Qwen3 32B — Güçlü"},
        {"id": "qwen-qwq-32b",                                     "name": "QwQ 32B — Akıl Yürütme"},
        {"id": "deepseek-r1-distill-llama-70b",                    "name": "DeepSeek R1 70B — Akıl Yürütme"},
        {"id": "deepseek-r1-distill-qwen-32b",                     "name": "DeepSeek R1 Qwen 32B"},
        {"id": "llama-3.1-8b-instant",                             "name": "Llama 3.1 8B — En Hızlı"},
        {"id": "gemma2-9b-it",                                     "name": "Gemma 2 9B — Google"},
    ]}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
