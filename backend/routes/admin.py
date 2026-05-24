from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from database import get_db
from services import db_storage
import os

router = APIRouter(prefix="/api/admin", tags=["admin"])


def check_admin(x_admin_key: Optional[str] = Header(None)):
    admin_key = os.getenv("ADMIN_KEY", "admin_secret_key_change_this")
    if x_admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")


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
