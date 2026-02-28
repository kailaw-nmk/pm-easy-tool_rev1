@echo off
chcp 65001 >nul
title Schedule Manager

cd /d "%~dp0webapp"

echo ========================================
echo   Schedule Manager
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js が見つかりません。
    echo   https://nodejs.org/ からインストールしてください。
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [SETUP] 初回セットアップ中...
    call npm install
    echo.
)

echo [START] 起動中...
echo   http://localhost:5173 をブラウザで開きます
echo.
echo   終了するにはこのウィンドウを閉じてください。
echo ========================================
echo.

start "" http://localhost:5173

call npm run dev
