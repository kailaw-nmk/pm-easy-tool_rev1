@echo off
chcp 65001 >nul
title ToS Schedule Manager

cd /d "%~dp0webapp"

echo ========================================
echo   ToS Schedule Manager
echo ========================================
echo.

if not exist "node_modules" (
    echo [SETUP] Installing dependencies...
    call npm install
    echo.
)

if not exist "data\schedule.json" (
    echo [SETUP] Importing draw.io data...
    call npm run import
    echo.
)

echo [START] Starting servers...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
echo   Press Ctrl+C to stop.
echo ========================================
echo.

start "" http://localhost:5173

call npm run dev
