@echo off
echo ============================================
echo  Smart College Academic Portal - Startup
echo ============================================
echo.

REM Check MongoDB
echo [1/4] Checking MongoDB Service...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MongoDB is not running!
    echo Please start MongoDB service:
    echo    net start MongoDB
    pause
    exit /b 1
)
echo [OK] MongoDB is running
echo.

REM Start Backend Server
echo [2/4] Starting Backend Server...
start "Smart College - Backend" cmd /k "cd /d "%~dp0server" && npm start"
timeout /t 3 /nobreak >nul
echo [OK] Backend server starting on http://localhost:5000
echo.

REM Wait for backend to be ready
echo [3/4] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul
echo.

REM Start Frontend
echo [4/4] Starting Frontend...
start "Smart College - Frontend" cmd /k "cd /d "%~dp0client" && npm start"
echo [OK] Frontend starting on http://localhost:3000
echo.

echo ============================================
echo  All servers started successfully!
echo ============================================
echo.
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo.
echo  Press any key to close this window...
echo  (Keep the other windows open)
echo ============================================
pause >nul
