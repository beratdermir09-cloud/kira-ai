@echo off
cd /d "%~dp0"

echo ========================================
echo   Kira AI Baslatiliyor...
echo ========================================
echo.
echo   Yerel: http://localhost:5173
echo   Deploy icin: DEPLOY.md dosyasini ac
echo.

echo Backend baslatiliyor (port 8000)...
start "AI Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak > nul

echo Frontend baslatiliyor (port 5173)...
start "AI Frontend" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo ========================================
echo   Uygulama hazir!
echo.
echo   Bilgisayardan: http://localhost:5173
echo.

:: IP adresini bul ve goster
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%
echo   Telefondan (ayni ag): http://%IP%:5173
echo   (Telefon ve bilgisayar ayni Wi-Fi'da olmali)
echo.
echo ========================================
echo   5 saniye sonra tarayici acilacak...
echo ========================================
timeout /t 5 /nobreak > nul
start http://localhost:5173

echo.
echo Pencereyi kapatabilirsiniz.
timeout /t 3 /nobreak > nul
exit
