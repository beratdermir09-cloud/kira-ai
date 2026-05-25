"""
Admin şifresi hash'i oluştur.
Kullanım: python create_admin_hash.py
Çıktıyı ADMIN_PASSWORD_HASH env variable'ına ekle.
"""
import hashlib
import getpass
import os

def hash_password(password: str, salt: str = "kira_admin_salt_2024") -> str:
    return hashlib.sha256(f"{salt}{password}{salt}".encode()).hexdigest()

if __name__ == "__main__":
    print("=" * 50)
    print("  Kira AI — Admin Şifre Hash Oluşturucu")
    print("=" * 50)
    password = getpass.getpass("Admin şifresini gir: ")
    confirm = getpass.getpass("Tekrar gir: ")
    
    if password != confirm:
        print("HATA: Şifreler eşleşmiyor!")
        exit(1)
    
    if len(password) < 8:
        print("HATA: Şifre en az 8 karakter olmalı!")
        exit(1)
    
    hashed = hash_password(password)
    print("\n" + "=" * 50)
    print("Railway/Vercel'e şu env variable'ı ekle:")
    print(f"\nADMIN_PASSWORD_HASH = {hashed}")
    print("=" * 50)
    print("\nBu hash'i güvenli bir yerde sakla.")
    print("Şifreyi kimseyle paylaşma.")
