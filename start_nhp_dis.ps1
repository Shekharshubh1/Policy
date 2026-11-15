# PowerShell Launcher for NHP-DIS
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " National Healthcare Policy Prediction & Decision Intelligence System" -ForegroundColor Cyan
Write-Host " Grounded in Official Indian Government Open Data (NFHS-5, RHS, MPI) " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "national_health_policy\backend"
$frontendDir = Join-Path $PSScriptRoot "national_health_policy\frontend"

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 5

Write-Host "[2/2] Starting React 18 Frontend on http://localhost:3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host "`n=====================================================================" -ForegroundColor Green
Write-Host " NHP-DIS Stack Active:" -ForegroundColor Green
Write-Host "   Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Frontend UI:      http://localhost:3001" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Green
