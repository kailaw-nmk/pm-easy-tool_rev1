# ============================================================
# C:\development 汎用ワークスペース セットアップ
# ============================================================

Write-Host "=== 汎用ワークスペース セットアップ ===" -ForegroundColor Cyan

# Node.js 確認
Write-Host "`n[1/4] Node.js 確認..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Node.js が必要です (v20+)" -ForegroundColor Red
    Write-Host "  https://nodejs.org/" -ForegroundColor Gray
    exit 1
}

# Claude Code 確認
Write-Host "`n[2/4] Claude Code 確認..." -ForegroundColor Yellow
$claudeVersion = claude --version 2>$null
if ($claudeVersion) {
    Write-Host "  Claude Code $claudeVersion" -ForegroundColor Green
} else {
    Write-Host "  インストール中..." -ForegroundColor Yellow
    npm install -g @anthropic-ai/claude-code
}

# MCP 設定確認
Write-Host "`n[3/4] MCP サーバー設定..." -ForegroundColor Yellow
if (Test-Path ".mcp.json") {
    Write-Host "  .mcp.json 確認済み（drawio, sequential-thinking）" -ForegroundColor Green
} else {
    Write-Host "  WARNING: .mcp.json が見つかりません" -ForegroundColor Red
}

# Git 初期化
Write-Host "`n[4/4] Git 初期化..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "  Git リポジトリは初期化済み" -ForegroundColor Green
} else {
    git init
    git add .
    git commit -m "chore: initial workspace setup"
    Write-Host "  Git リポジトリを初期化しました" -ForegroundColor Green
}

Write-Host "`n=== セットアップ完了 ===" -ForegroundColor Cyan
Write-Host @"

使い方:
  claude                                  Claude Code を起動
  /mcp                                    MCP サーバー接続確認
  /project:new-workspace [テーマ]          作業ディレクトリ作成
  /project:create-doc [内容]               ドキュメント作成
  /project:create-diagram [内容]           ダイアグラム作成
  /project:analyze [対象]                  資料の調査・分析
  /project:convert [対象]                  ファイル形式変換

"@ -ForegroundColor White
