@echo off
cd /d "%~dp0"
echo ========================================
echo   AI Assistant - Kurulum Scripti
echo ========================================
echo.

echo [1/5] Python backend kuruluyor...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
echo Backend kurulumu tamamlandi!
echo.

echo [2/5] .env dosyasi olusturuluyor...
if not exist .env (
    copy .env.example .env
    echo .env dosyasi olusturuldu!
    echo ONEMLI: backend\.env dosyasini ac ve GROQ_API_KEY degerini gir!
) else (
    echo .env dosyasi zaten mevcut.
)
echo.

echo [3/5] MySQL veritabani olusturuluyor...
echo XAMPP MySQL calistigindan emin olun!
python create_db.py
echo.

echo [4/5] Frontend kuruluyor...
cd ..\frontend
npm install
echo Frontend kurulumu tamamlandi!
echo.

echo [5/5] Kurulum tamamlandi!
echo.
echo ========================================
echo   Sonraki adimlar:
echo   1. backend\.env dosyasina GROQ_API_KEY ekle
echo   2. Firebase kurulumu icin FIREBASE_KURULUM.md oku
echo   3. frontend\.env dosyasina Firebase bilgilerini ekle
echo   4. start.bat ile baslat
echo ========================================
pause
