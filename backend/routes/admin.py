from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
from database import get_db
from services import db_storage
import os
import hashlib
import hmac
import secrets
import time

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Aktif session token'ları (memory-based)
_active_sessions: dict[str, dict] = {}
SESSION_TTL = 3600  # 1 saat

# Brute force koruması: IP başına başarısız deneme sayısı
_failed_attempts: dict[str, list] = {}
MAX_ATTEMPTS = 5        # 5 dakikada max 5 deneme
LOCKOUT_WINDOW = 300    # 5 dakika


def _hash_password(password: str) -> str:
    salt = os.getenv("ADMIN_SALT", "kira_admin_salt_2024")
    return hashlib.sha256(f"{salt}{password}{salt}".encode()).hexdigest()


def _is_locked_out(ip: str) -> bool:
    now = time.time()
    attempts = _failed_attempts.get(ip, [])
    # Son 5 dakikadaki denemeleri filtrele
    recent = [t for t in attempts if now - t < LOCKOUT_WINDOW]
    _failed_attempts[ip] = recent
    return len(recent) >= MAX_ATTEMPTS


def _record_failed(ip: str):
    if ip not in _failed_attempts:
        _failed_attempts[ip] = []
    _failed_attempts[ip].append(time.time())


def _clear_failed(ip: str):
    _failed_attempts.pop(ip, None)


def _verify_session(token: str) -> bool:
    if token not in _active_sessions:
        return False
    session = _active_sessions[token]
    if time.time() - session["created_at"] > SESSION_TTL:
        del _active_sessions[token]
        return False
    session["last_active"] = time.time()
    return True


def check_admin(x_admin_token: Optional[str] = Header(None)):
    if not x_admin_token or not _verify_session(x_admin_token):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")


class AdminLoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def admin_login(req: AdminLoginRequest, x_forwarded_for: Optional[str] = Header(None)):
    ip = x_forwarded_for or "unknown"

    # Brute force kontrolü
    if _is_locked_out(ip):
        raise HTTPException(
            status_code=429,
            detail=f"Çok fazla başarısız deneme. {LOCKOUT_WINDOW // 60} dakika bekleyin."
        )

    stored_hash = os.getenv("ADMIN_PASSWORD_HASH", "")
    stored_username = os.getenv("ADMIN_USERNAME", "admin")

    if not stored_hash:
        raise HTTPException(status_code=500, detail="Admin şifresi ayarlanmamış")

    # Kullanıcı adı kontrolü
    username_ok = hmac.compare_digest(req.username.lower(), stored_username.lower())
    # Şifre kontrolü
    input_hash = _hash_password(req.password)
    password_ok = hmac.compare_digest(input_hash, stored_hash)

    if not username_ok or not password_ok:
        _record_failed(ip)
        remaining = MAX_ATTEMPTS - len(_failed_attempts.get(ip, []))
        time.sleep(1)  # Brute force yavaşlatma
        raise HTTPException(
            status_code=401,
            detail=f"Hatalı kullanıcı adı veya şifre. {max(0, remaining)} deneme hakkınız kaldı."
        )

    _clear_failed(ip)
    token = secrets.token_urlsafe(32)
    _active_sessions[token] = {
        "created_at": time.time(),
        "last_active": time.time(),
        "ip": ip,
    }

    return {"token": token, "expires_in": SESSION_TTL}


@router.post("/logout")
async def admin_logout(x_admin_token: Optional[str] = Header(None)):
    if x_admin_token and x_admin_token in _active_sessions:
        del _active_sessions[x_admin_token]
    return {"ok": True}


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db), _=Depends(check_admin)):
    return await db_storage.get_stats(db)


@router.get("/users")
async def get_users(db: AsyncSession = Depends(get_db), _=Depends(check_admin)):
    users = await db_storage.get_all_users(db)
    return [
        {
            "id": u.id,
            "email": u.email,
            "display_name": u.display_name,
            "photo_url": u.photo_url,
            "total_messages": u.total_messages,
            "created_at": u.created_at.isoformat(),
            "last_seen": u.last_seen.isoformat(),
            "is_admin": u.is_admin,
        }
        for u in users
    ]


@router.get("/activity")
async def get_activity(db: AsyncSession = Depends(get_db), _=Depends(check_admin)):
    """Son 50 mesajı döndür (kullanıcı bilgisiyle)."""
    from sqlalchemy import select, desc
    from database import Message, Conversation, User as DBUser

    result = await db.execute(
        select(Message, Conversation.title, DBUser.display_name, DBUser.email)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .join(DBUser, Conversation.user_id == DBUser.id)
        .where(Message.role == 'user')
        .order_by(desc(Message.created_at))
        .limit(50)
    )
    rows = result.all()

    from services.encryption import decrypt_text
    activity = []
    for msg, conv_title, display_name, email in rows:
        try:
            content = decrypt_text(msg.content)[:120]
        except Exception:
            content = '(şifreli)'
        activity.append({
            "id": msg.id,
            "user": display_name or email or 'Anonim',
            "content": content,
            "conversation": conv_title,
            "created_at": msg.created_at.isoformat(),
        })
    return activity


@router.get("/health")
async def get_health(db: AsyncSession = Depends(get_db), _=Depends(check_admin)):
    """Sistem sağlık durumu."""
    import time as time_module
    start = time_module.time()

    # DB bağlantı testi
    db_ok = False
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    db_latency = round((time_module.time() - start) * 1000, 1)

    # Groq API testi
    groq_ok = bool(os.getenv("GROQ_API_KEY"))

    return {
        "db_connected": db_ok,
        "db_latency_ms": db_latency,
        "groq_configured": groq_ok,
        "active_sessions": len(_active_sessions),
        "model": os.getenv("MODEL_NAME", "llama-3.3-70b-versatile"),
        "environment": "production" if os.getenv("DATABASE_URL") else "local",
    }


@router.get("/security")
async def get_security_info(_=Depends(check_admin)):
    """Güvenlik durumu bilgisi."""
    now = time.time()
    active_count = sum(1 for s in _active_sessions.values() if now - s["created_at"] < SESSION_TTL)
    locked_ips = [ip for ip, attempts in _failed_attempts.items()
                  if len([t for t in attempts if now - t < LOCKOUT_WINDOW]) >= MAX_ATTEMPTS]
    suspicious = {ip: len([t for t in attempts if now - t < LOCKOUT_WINDOW])
                  for ip, attempts in _failed_attempts.items()
                  if len([t for t in attempts if now - t < LOCKOUT_WINDOW]) > 0}

    return {
        "active_sessions": active_count,
        "locked_ips": locked_ips,
        "suspicious_ips": suspicious,
        "max_attempts": MAX_ATTEMPTS,
        "lockout_minutes": LOCKOUT_WINDOW // 60,
    }


@router.get("/verify")
async def verify_token(_=Depends(check_admin)):
    return {"valid": True}
