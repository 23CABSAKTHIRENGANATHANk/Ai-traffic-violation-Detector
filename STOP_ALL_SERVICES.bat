@echo off
echo ============================================================
echo   STOPPING AI TRAFFIC VIOLATION DETECTION SYSTEM
echo ============================================================
echo.

echo Killing Node.js processes (Frontend & Backend)...
taskkill /F /IM node.exe > nul 2>&1
if %errorlevel% == 0 (
    echo [SUCCESS] Node.js services stopped.
) else (
    echo [INFO] No Node.js services were running.
)

echo.
echo Killing Python processes (AI Service)...
taskkill /F /IM python.exe > nul 2>&1
if %errorlevel% == 0 (
    echo [SUCCESS] Python AI Service stopped.
) else (
    echo [INFO] No Python services were running.
)

echo.
echo ============================================================
echo   ALL SERVICES STOPPED!
echo ============================================================
pause
