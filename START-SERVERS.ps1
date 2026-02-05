# Smart College Academic Portal - PowerShell Startup Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Smart College Academic Portal - Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check MongoDB
Write-Host "[1/4] Checking MongoDB Service..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService -eq $null -or $mongoService.Status -ne "Running") {
    Write-Host "[ERROR] MongoDB is not running!" -ForegroundColor Red
    Write-Host "Please start MongoDB service:" -ForegroundColor Red
    Write-Host "   net start MongoDB" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] MongoDB is running" -ForegroundColor Green
Write-Host ""

# Get project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend Server
Write-Host "[2/4] Starting Backend Server..." -ForegroundColor Yellow
$backendDir = Join-Path $projectDir "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm start" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "[OK] Backend server starting on http://localhost:5000" -ForegroundColor Green
Write-Host ""

# Wait for backend
Write-Host "[3/4] Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Start Frontend
Write-Host "[4/4] Starting Frontend..." -ForegroundColor Yellow
$frontendDir = Join-Path $projectDir "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; Write-Host 'Frontend Starting...' -ForegroundColor Green; npm start" -WindowStyle Normal
Write-Host "[OK] Frontend starting on http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " All servers started successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Keep the server windows open!" -ForegroundColor Yellow
Write-Host "  Press any key to close this window..." -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
