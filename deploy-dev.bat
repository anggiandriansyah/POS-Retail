@echo off
echo ========================================================
echo    ALPHOS v1.4.0 - Deploy ke Environment DEV (develop)
echo ========================================================
cd /d "%~dp0"
where git >nul 2>nul || (echo Git belum terpasang. & pause & exit /b 1)
if not exist ".git" (git init & git branch -M develop)
git add .
git commit -m "feat(release): ALPHOS by AlphaGen v1.4.0 to DEV"
git push origin develop
echo.
echo Selesai! Pantau build DEV di:
echo https://pos-retail-git-develop-anggiandriansyah.vercel.app/
pause
