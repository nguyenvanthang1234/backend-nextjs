@echo off
title API SHOP - Redis + Server
color 0A

echo ========================================
echo   API SHOP - Starting Services
echo ========================================
echo.

REM Check if Redis is installed
if exist "C:\Redis\redis-server.exe" (
    echo [1/2] Starting Redis Server...
    start "Redis Server" /MIN "C:\Redis\redis-server.exe"
    timeout /t 2 /nobreak >nul
    echo       Redis started on port 6379
    echo.
) else (
    echo [!] Redis not found at C:\Redis
    echo.
    echo Please install Redis first:
    echo   1. Download: https://github.com/tporadowski/redis/releases/latest
    echo   2. Extract to C:\Redis
    echo   3. Run this script again
    echo.
    pause
    exit
)

echo [2/2] Starting Node.js Application...
echo.
npm start

pause
