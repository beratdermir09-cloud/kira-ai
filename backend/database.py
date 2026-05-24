from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Integer
from datetime import datetime
from typing import Optional, List
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# MySQL bağlantı bilgileri
# Railway'de DATABASE_URL otomatik set edilir
# Lokalde .env'den okunur
_DATABASE_URL = os.getenv("DATABASE_URL")

if _DATABASE_URL:
    # Railway MySQL URL'si genellikle mysql:// ile başlar, aiomysql için düzelt
    if _DATABASE_URL.startswith("mysql://"):
        _DATABASE_URL = _DATABASE_URL.replace("mysql://", "mysql+aiomysql://", 1)
    elif _DATABASE_URL.startswith("mysql+mysqlconnector://"):
        _DATABASE_URL = _DATABASE_URL.replace("mysql+mysqlconnector://", "mysql+aiomysql://", 1)
    DATABASE_URL = _DATABASE_URL
else:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "ai_assistant")
    DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    total_messages: Mapped[int] = mapped_column(Integer, default=0)
    preferences: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON
    modules: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON array

    conversations: Mapped[List["Conversation"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(128), ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255), default="Yeni Sohbet")
    tags: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False)
    share_id: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id"))
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    model_used: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


async def init_db():
    """Tabloları oluştur (yoksa)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("MySQL veritabani hazir!")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
