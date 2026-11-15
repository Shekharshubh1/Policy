@echo off
title NHP-DIS Permanent Backend Server + Cloudflare Tunnel
echo =====================================================================
echo  National Healthcare Policy Decision Intelligence System (NHP-DIS)
echo  Permanent Cloudflare Tunnel to api.fddcloud.me
echo =====================================================================
echo.

:: Add cloudflared to PATH
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    set "PATH=C:\Program Files (x86)\cloudflared;%PATH%"
)
if exist "C:\Program Files\cloudflared\cloudflared.exe" (
    set "PATH=C:\Program Files\cloudflared;%PATH%"
)

:: 1. Start Backend Server
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "NHP-DIS Backend Server" cmd /k "cd national_health_policy\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

:: 2. Check if permanent tunnel credentials exist
if exist "%USERPROFILE%\.cloudflared\cert.pem" (
    echo [2/2] Launching Permanent Named Tunnel to https://api.fddcloud.me ...
    cloudflared tunnel run --url http://localhost:8000 policy-backend
) else (
    echo [2/2] Permanent certificate not found. Launching quick tunnel...
    echo (To make your URL permanent, run: cloudflared tunnel login)
    cloudflared tunnel --url http://localhost:8000
)

pause
