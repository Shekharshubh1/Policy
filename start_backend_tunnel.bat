@echo off
title NHP-DIS Backend + Cloudflare Tunnel
echo =====================================================================
echo  National Healthcare Policy Decision Intelligence System (NHP-DIS)
echo  Local Backend Server + Cloudflare Public HTTPS Tunnel
echo =====================================================================
echo.

:: 1. Start Backend Server
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "NHP-DIS Backend Server" cmd /k "cd national_health_policy\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo Waiting 4 seconds for backend initialization...
timeout /t 4 /nobreak >nul

:: Add cloudflared to PATH if in standard Program Files directory
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    set "PATH=C:\Program Files (x86)\cloudflared;%PATH%"
)
if exist "C:\Program Files\cloudflared\cloudflared.exe" (
    set "PATH=C:\Program Files\cloudflared;%PATH%"
)

:: 2. Check if cloudflared exists
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [2/2] cloudflared is not in PATH. Installing via winget...
    winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
    echo.
)

echo [2/2] Starting Cloudflare Quick Tunnel for http://localhost:8000 ...
echo ---------------------------------------------------------------------
echo Copy the HTTPS URL below (e.g. https://xxxx.trycloudflare.com)
echo and set it as BACKEND_API_URL in your Cloudflare dashboard!
echo ---------------------------------------------------------------------
cloudflared tunnel --url http://localhost:8000

pause
