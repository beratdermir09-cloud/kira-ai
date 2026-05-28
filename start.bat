@echo off
cd /d "%~dp0"

echo ========================================
echo   Kira AI Baslatiliyor...
echo ========================================
echo.
echo   Web: https://kiragpt.vercel.app
echo.

echo Backend baslatiliyor (port 8000)...
start "Kira Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo   Backend hazir!
echo.
echo   Uygulama: https://kiragpt.vercel.app
echo ========================================
echo.
echo   NOT: Veritabani icin XAMPP'tan
echo   sadece MySQL'i baslatmaniz yeterli.
echo   Apache'ye gerek yok.
echo.
echo ========================================
echo   5 saniye sonra tarayici acilacak...
echo ========================================
timeout /t 5 /nobreak > nul
start https://kiragpt.vercel.app

echo.
echo Pencereyi kapatabilirsiniz.
timeout /t 3 /nobreak > nul
exit
