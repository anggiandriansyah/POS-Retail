@echo off
echo ========================================================
echo    ALPHOS v2.0.0 - Deploy ke PRODUCTION (main)
echo ========================================================
cd /d "%~dp0"
where git >nul 2>nul || (echo Git belum terpasang. & pause & exit /b 1)
git checkout -B main
git merge develop
git push origin main
echo.
echo Selesai! Pantau build PRODUCTION di Vercel Dashboard.
pause
