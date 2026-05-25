from fastapi import APIRouter, Header, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
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

# Aktif session token'ları (memory-based, restart'ta sıfırlanır)
# Production'da Redis kullanılabilir ama bu yeterince güvenli
_active_sessions: dict[str, float] = {}
SESSION_TTL = 3600  # 1 saat


def _hash_password(password: str) -> str:
    """SHA-256 + salt ile şifrele."""
    salt = os.getenv("ADMIN_SALT", "kira_admin_salt_2024")
    return hashlib.sha256(f"{salt}{password}{salt}".encode()).hexdigest()


def _verify_session(token: str) -> bool:
    """Session token geçerli mi ve süresi dolmamış mı?"""
    if token not in _active_sessions:
        return False
    if time.time() - _active_sessions[token] > SESSION_TTL:
        del _active_sessions[token]
        return False
    # Her istekte TTL'i yenile
    _active_sessions[token] = time.time()
    return True


def check_admin(x_admin_token: Optional[str] = Header(None)):
    """Admin token kontrolü — her korumalı endpoint'te kullan."""
    if not x_admin_token or not _verify_session(x_admin_token):
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")


class AdminLoginRequest(BaseModel):
    password: str


@router.post("/login")
async def admin_login(req: AdminLoginRequest):
    """
    Admin girişi — şifre hash'lenerek karşılaştırılır.
    Başarılıysa session token döner.
    """
    stored_hash = os.getenv("ADMIN_PASSWORD_HASH", "")

    if not stored_hash:
        raise HTTPException(status_code=500, detail="Admin şifresi ayarlanmamış")

    # Timing attack'a karşı hmac.compare_digest kullan
    input_hash = _hash_password(req.password)
    if not hmac.compare_digest(input_hash, stored_hash):
        # Brute force'u yavaşlat
        time.sleep(1)
        raise HTTPException(status_code=401, detail="Hatalı şifre")

    # Güvenli random token üret
    token = secrets.token_urlsafe(32)
    _active_sessions[token] = time.time()

    return {"token": token, "expires_in": SESSION_TTL}


@router.post("/logout")
async def admin_logout(x_admin_token: Optional[str] = Header(None)):
    """Session'ı sonlandır."""
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


@router.get("/verify")
async def verify_token(_=Depends(check_admin)):
    """Token geçerli mi kontrol et."""
    return {"valid": True}
