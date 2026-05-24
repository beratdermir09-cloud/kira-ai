from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, desc
from sqlalchemy.orm import selectinload
from database import User, Conversation, Message
from datetime import datetime
from typing import Optional, List
import uuid
from services.encryption import encrypt_text, decrypt_text


# ── User ──────────────────────────────────────────────────────────────────────

async def upsert_user(db: AsyncSession, user_id: str, email: str = None,
                      display_name: str = None, photo_url: str = None) -> User:
    user = await db.get(User, user_id)
    if user:
        user.last_seen = datetime.now()
        if display_name: user.display_name = display_name
        if photo_url: user.photo_url = photo_url
    else:
        user = User(id=user_id, email=email, display_name=display_name,
                    photo_url=photo_url, created_at=datetime.now(), last_seen=datetime.now())
        db.add(user)
    await db.commit()
    return user


async def get_all_users(db: AsyncSession) -> List[User]:
    result = await db.execute(select(User).order_by(desc(User.last_seen)))
    return result.scalars().all()


async def get_stats(db: AsyncSession) -> dict:
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_convs = (await db.execute(select(func.count(Conversation.id)))).scalar()
    total_msgs = (await db.execute(select(func.count(Message.id)))).scalar()
    return {"total_users": total_users, "total_conversations": total_convs, "total_messages": total_msgs}


# ── Conversations ─────────────────────────────────────────────────────────────

async def get_conversations(db: AsyncSession, user_id: str) -> List[dict]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(desc(Conversation.is_pinned), desc(Conversation.updated_at))
    )
    convs = result.scalars().all()
    return [conv_to_dict(c) for c in convs]


async def get_conversation(db: AsyncSession, conv_id: str, user_id: str) -> Optional[dict]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id, Conversation.user_id == user_id)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    return conv_to_dict(conv, include_messages=True) if conv else None


async def get_shared_conversation(db: AsyncSession, share_id: str) -> Optional[dict]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.share_id == share_id, Conversation.is_shared == True)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    return conv_to_dict(conv, include_messages=True) if conv else None


async def create_conversation(db: AsyncSession, user_id: str, title: str = "Yeni Sohbet") -> dict:
    # Ensure user exists
    user = await db.get(User, user_id)
    if not user:
        user = User(id=user_id)
        db.add(user)

    conv = Conversation(id=str(uuid.uuid4()), user_id=user_id, title=title,
                        created_at=datetime.now(), updated_at=datetime.now())
    db.add(conv)
    await db.commit()
    return conv_to_dict(conv)


async def update_conversation(db: AsyncSession, conv_id: str, user_id: str, **kwargs) -> Optional[dict]:
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        return None
    for k, v in kwargs.items():
        if hasattr(conv, k):
            setattr(conv, k, v)
    conv.updated_at = datetime.now()
    await db.commit()
    return conv_to_dict(conv)


async def delete_conversation(db: AsyncSession, conv_id: str, user_id: str):
    await db.execute(delete(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user_id))
    await db.commit()


async def share_conversation(db: AsyncSession, conv_id: str, user_id: str) -> Optional[str]:
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        return None
    if not conv.share_id:
        conv.share_id = str(uuid.uuid4())[:8]
    conv.is_shared = True
    await db.commit()
    return conv.share_id


# ── Messages ──────────────────────────────────────────────────────────────────

async def add_message(db: AsyncSession, conv_id: str, role: str, content: str,
                      file_name: str = None, model_used: str = None, user_id: str = None) -> dict:
    encrypted_content = encrypt_text(content)
    msg = Message(id=str(uuid.uuid4()), conversation_id=conv_id, role=role,
                  content=encrypted_content, file_name=file_name, model_used=model_used,
                  created_at=datetime.now())
    db.add(msg)

    # Update conversation
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if conv:
        conv.updated_at = datetime.now()
        # Auto-title from first user message
        if role == "user":
            msgs_count = await db.execute(
                select(func.count(Message.id)).where(Message.conversation_id == conv_id)
            )
            if (msgs_count.scalar() or 0) <= 1:
                conv.title = content[:50] + ("..." if len(content) > 50 else "")

    # Update user message count
    if user_id and role == "user":
        user = await db.get(User, user_id)
        if user:
            user.total_messages = (user.total_messages or 0) + 1

    await db.commit()
    return msg_to_dict(msg)


async def pin_message(db: AsyncSession, msg_id: str, user_id: str) -> bool:
    result = await db.execute(
        select(Message)
        .join(Conversation)
        .where(Message.id == msg_id, Conversation.user_id == user_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        return False
    msg.is_pinned = not msg.is_pinned
    await db.commit()
    return msg.is_pinned


async def search_messages(db: AsyncSession, user_id: str, query: str) -> List[dict]:
    # Since messages are encrypted, we can't search via SQL ILIKE.
    # We must fetch messages for the user and search in memory.
    result = await db.execute(
        select(Message, Conversation.title)
        .join(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(desc(Message.created_at))
    )
    rows = result.all()
    
    matches = []
    query_lower = query.lower()
    for m, title in rows:
        decrypted = decrypt_text(m.content)
        if query_lower in decrypted.lower():
            m_dict = msg_to_dict(m)
            m_dict["content"] = decrypted # ensure it's decrypted
            matches.append({"message": m_dict, "conversation_title": title})
            if len(matches) >= 20: # limit to 20 results
                break
    return matches


# ── Helpers ───────────────────────────────────────────────────────────────────

def conv_to_dict(conv: Conversation, include_messages: bool = False) -> dict:
    d = {
        "id": conv.id,
        "title": conv.title,
        "tags": conv.tags.split(",") if conv.tags else [],
        "is_pinned": conv.is_pinned,
        "is_shared": conv.is_shared,
        "share_id": conv.share_id,
        "model": conv.model,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "user_id": conv.user_id,
        "messages": [],
    }
    if include_messages:
        d["messages"] = [msg_to_dict(m) for m in (conv.messages or [])]
    return d


def msg_to_dict(msg: Message) -> dict:
    return {
        "id": msg.id,
        "role": msg.role,
        "content": decrypt_text(msg.content) if msg.content else "",
        "file_name": msg.file_name,
        "is_pinned": msg.is_pinned,
        "model_used": msg.model_used,
        "timestamp": msg.created_at.isoformat(),
        "conversation_id": msg.conversation_id,
    }
