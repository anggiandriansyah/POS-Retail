@echo off
echo ========================================================
echo    ALPHOS by AlphaGen (v2.0.0) - Automated Deployment
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Memeriksa instalasi Git...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git belum terdeteksi di PATH komputer Anda.
    echo Silakan install Git for Windows dari: https://git-scm.com/download/win
    echo atau jalankan dari terminal VS Code yang sudah memiliki Git.
    pause
    exit /b 1
)

echo [2/4] Menyiapkan repositori & commit v1.4.0...
if not exist ".git" (
    git init
    git branch -M develop
)

git add .
git commit -m "feat(release): ALPHOS by AlphaGen v2.0.0 (Superadmin Hub, Visual Analytics, Anti-Fraud Discount, Smart Notif Audio Chime, PWA)"

echo.
echo [3/4] Mendorong ke Environment DEV (Branch develop)...
git push origin develop
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Jika ini push pertama atau remote belum disetel, jalankan:
    echo        git remote add origin https://github.com/anggiandriansyah/pos-retail.git
    echo        git push -u origin develop
    echo.
) else (
    echo [SUCCESS] Berhasil push ke branch develop! Vercel DEV otomatis build.
)

echo.
echo [4/4] Mempromosikan ke Environment PRODUCTION (Branch main)...
git checkout -B main
git merge develop
git push origin main
if %errorlevel% neq 0 (
    echo [INFO] Push ke main memerlukan verifikasi remote repo.
) else (
    echo [SUCCESS] Berhasil deploy ke branch main (PRODUCTION Vercel)!
)

echo.
echo ========================================================
echo   Deployment selesai! Silakan pantau di Vercel Dashboard.
echo ========================================================
pause
