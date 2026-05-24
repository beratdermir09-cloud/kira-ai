import asyncio
from database import engine
from sqlalchemy import text

async def upgrade_db():
    async with engine.begin() as conn:
        try:
            print("Kullanıcılar tablosuna yeni sütunlar ekleniyor...")
            await conn.execute(text("ALTER TABLE users ADD COLUMN preferences TEXT"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN modules TEXT"))
            print("> Basarili! Veritabani guncellendi.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("> Sutunlar zaten mevcut, islem yapmaya gerek yok.")
            else:
                print(f"! Hata olustu: {e}")

if __name__ == "__main__":
    asyncio.run(upgrade_db())
