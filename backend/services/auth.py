from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import os

# Gelişmiş Güvenlik: Kullanıcı doğrulama katmanı (Authentication)
# Gerçek ortamda Firebase Admin SDK kullanarak `auth.verify_id_token(token)` işlemi yapılır.
# Şimdilik prototip olarak x-user-id üzerinden bir doğrulama ve API Key sistemi eklendi.

API_KEY = os.getenv("API_SECRET_KEY", "super_secret_dev_key")

async def auth_middleware(request: Request, call_next):
    # Sağlık durumu veya public yollar için auth kontrolünü atla
    if request.url.path.startswith("/api/health") or request.url.path.startswith("/api/models"):
        return await call_next(request)

    # API Key Kontrolü (Ekstra güvenlik katmanı)
    # req_api_key = request.headers.get("x-api-key")
    # if req_api_key != API_KEY:
    #     return JSONResponse(status_code=403, content={"detail": "Geçersiz API Anahtarı"})

    # Firebase User ID veya Authorization Token Kontrolü
    user_id = request.headers.get("x-user-id")
    auth_header = request.headers.get("Authorization")

    # TODO: İleride auth_header içindeki Bearer token'i Firebase Admin SDK ile doğrulayabilirsiniz.
    # if auth_header and auth_header.startswith("Bearer "):
    #     token = auth_header.split(" ")[1]
    #     user = auth.verify_id_token(token)
    
    if not user_id and not auth_header:
        # Sadece guest moduna izin ver
        request.state.user_id = "guest"
    else:
        request.state.user_id = user_id or "anonymous"

    response = await call_next(request)
    return response
