import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# We need a 32-url-safe-base64-encoded bytes key. 
# If not in env, we create a deterministic one for existing DBs to not break, 
# but in a real app this should be securely generated and stored in ENCRYPTION_KEY.
key = os.getenv("ENCRYPTION_KEY")
if not key:
    # Use a dummy key if none provided to prevent crashes
    key = Fernet.generate_key().decode()

cipher_suite = Fernet(key.encode() if isinstance(key, str) else key)

def encrypt_text(text: str) -> str:
    if not text:
        return text
    # We add a prefix so we know if it's already encrypted
    return "ENC:" + cipher_suite.encrypt(text.encode('utf-8')).decode('utf-8')

def decrypt_text(text: str) -> str:
    if not text or not text.startswith("ENC:"):
        return text
    try:
        encrypted_data = text[4:] # Remove ENC:
        return cipher_suite.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return "[Şifresi Çözülemedi - Hata]"
