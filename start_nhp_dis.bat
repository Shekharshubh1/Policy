@echo off
title National Healthcare Policy Decision Intelligence System (NHP-DIS)
echo =====================================================================
echo  National Healthcare Policy Prediction & Decision Intelligence System
echo  Grounded in Official Indian Government Open Data (NFHS-5, RHS, MPI)
echo =====================================================================
echo.

echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "NHP-DIS Backend Server" cmd /k "cd national_health_policy\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo Waiting 5 seconds for backend initialization...
timeout /t 5 /nobreak >nul

echo [2/2] Launching React 18 Frontend on http://localhost:3001 ...
start "NHP-DIS Frontend Dashboard" cmd /k "cd national_health_policy\frontend && npm run dev"

echo.
echo =====================================================================
echo Both services launched:
echo   - Backend API:    http://localhost:8000 (Docs: http://localhost:8000/docs)
echo   - Frontend UI:    http://localhost:3001
echo =====================================================================
echo Press any key to exit this launcher window (services will stay running).
pause >nul
