"""
Bu script MySQL'de ai_assistant veritabanını ve tablolarını oluşturur.
Çalıştırmak için: python create_db.py
"""
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "ai_assistant")

print(f"MySQL'e bağlanılıyor: {DB_USER}@{DB_HOST}:{DB_PORT}")

try:
    # Önce veritabanını oluştur
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        charset="utf8mb4"
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    conn.commit()
    cursor.close()
    conn.close()
    print(f"> '{DB_NAME}' veritabanı oluşturuldu!")

    # Tabloları oluştur
    import asyncio
    from database import init_db
    asyncio.run(init_db())
    print("> Tablolar oluşturuldu!")
    print("\nphpMyAdmin'de görmek için:")
    print(f"  http://localhost/phpmyadmin")
    print(f"  Veritabanı: {DB_NAME}")

except Exception as e:
    print(f"! Hata: {e}")
    print("\nXAMPP'ta MySQL çalışıyor mu? Kontrol et!")
