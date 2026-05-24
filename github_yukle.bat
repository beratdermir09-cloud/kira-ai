@echo off
cd /d "%~dp0"
echo ========================================
echo   Kira AI - GitHub'a Yukle
echo ========================================
echo.

:: Git kurulu mu kontrol et
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Git kurulu degil!
    echo.
    echo Git indirmek icin tarayici aciliyor...
    start https://git-scm.com/download/win
    echo.
    echo Git'i yukledikten sonra bu dosyayi tekrar calistir.
    pause
    exit
)

echo Git bulundu.
echo.

:: GitHub kullanici adi sor
set /p GITHUB_USER=GitHub kullanici adinizi girin: 
set /p REPO_NAME=Repo ismi girin (ornek: kira-ai): 

echo.
echo Proje klasorune geciliyor...

:: Git repo baslatma
if not exist ".git" (
    git init
    echo Git repo baslatildi.
) else (
    echo Git repo zaten mevcut.
)

:: .env dosyalarini gitignore'a ekle (zaten var ama emin olalim)
git config core.autocrlf true

:: Dosyalari ekle
git add .
git status

echo.
echo Commit yapiliyor...
git commit -m "Kira AI - ilk deploy"

:: Ana branch main yap
git branch -M main

:: Remote ekle
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo ========================================
echo GitHub'a push yapiliyor...
echo Sifrenizi veya token'inizi girmeniz istenebilir.
echo ========================================
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   BASARILI! Kod GitHub'a yuklendi.
    echo.
    echo   Repo: https://github.com/%GITHUB_USER%/%REPO_NAME%
    echo.
    echo   Simdi DEPLOY.md dosyasini ac ve
    echo   Adim 2'den devam et (Railway).
    echo ========================================
    start https://github.com/%GITHUB_USER%/%REPO_NAME%
) else (
    echo.
    echo [HATA] Push basarisiz oldu.
    echo.
    echo Cozum: GitHub'da once repo olustur:
    start https://github.com/new
    echo Repo adini "%REPO_NAME%" yap, sonra tekrar calistir.
)

pause
