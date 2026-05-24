from fastapi import APIRouter, HTTPException, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from pydantic import BaseModel
from database import get_db
from services import db_storage

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class ConversationCreate(BaseModel):
    title: Optional[str] = "Yeni Sohbet"


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    is_pinned: Optional[bool] = None


def uid(x_user_id: Optional[str] = None) -> str:
    return x_user_id or "anonymous"


@router.get("/")
async def get_conversations(x_user_id: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    return await db_storage.get_conversations(db, uid(x_user_id))


@router.post("/")
async def create_conversation(body: ConversationCreate, x_user_id: Optional[str] = Header(None),
                               db: AsyncSession = Depends(get_db)):
    return await db_storage.create_conversation(db, uid(x_user_id), body.title)


@router.get("/search")
async def search(q: str, x_user_id: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    return await db_storage.search_messages(db, uid(x_user_id), q)


@router.get("/shared/{share_id}")
async def get_shared(share_id: str, db: AsyncSession = Depends(get_db)):
    conv = await db_storage.get_shared_conversation(db, share_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Paylaşılan sohbet bulunamadı")
    return conv


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, x_user_id: Optional[str] = Header(None),
                            db: AsyncSession = Depends(get_db)):
    conv = await db_storage.get_conversation(db, conversation_id, uid(x_user_id))
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")
    return conv


@router.patch("/{conversation_id}")
async def update_conversation(conversation_id: str, body: ConversationUpdate,
                               x_user_id: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    kwargs = {}
    if body.title is not None: kwargs["title"] = body.title
    if body.tags is not None: kwargs["tags"] = ",".join(body.tags)
    if body.is_pinned is not None: kwargs["is_pinned"] = body.is_pinned
    result = await db_storage.update_conversation(db, conversation_id, uid(x_user_id), **kwargs)
    if not result:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")
    return result


@router.post("/{conversation_id}/share")
async def share_conversation(conversation_id: str, x_user_id: Optional[str] = Header(None),
                              db: AsyncSession = Depends(get_db)):
    share_id = await db_storage.share_conversation(db, conversation_id, uid(x_user_id))
    if not share_id:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadı")
    return {"share_id": share_id, "share_url": f"/shared/{share_id}"}


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, x_user_id: Optional[str] = Header(None),
                               db: AsyncSession = Depends(get_db)):
    await db_storage.delete_conversation(db, conversation_id, uid(x_user_id))
    return {"success": True}
