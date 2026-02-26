# ============================================================
# Claude Code 環境セットアップスクリプト
# C:\development をルートとして実行してください
# ============================================================
# 使い方:
#   1. このファイルを C:\development\ に配置
#   2. PowerShell で実行: .\setup.ps1
# ============================================================

Write-Host "=== Claude Code 環境セットアップ ===" -ForegroundColor Cyan

# Node.js バージョン確認
Write-Host "`n[1/5] Node.js バージョン確認..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  Node.js $nodeVersion が見つかりました" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Node.js が見つかりません。v20+ をインストールしてください。" -ForegroundColor Red
    Write-Host "  https://nodejs.org/" -ForegroundColor Gray
    exit 1
}

# Claude Code インストール確認
Write-Host "`n[2/5] Claude Code 確認..." -ForegroundColor Yellow
$claudeVersion = claude --version 2>$null
if ($claudeVersion) {
    Write-Host "  Claude Code $claudeVersion が見つかりました" -ForegroundColor Green
} else {
    Write-Host "  Claude Code をインストールします..." -ForegroundColor Yellow
    npm install -g @anthropic-ai/claude-code
}

# MCP サーバー追加（プロジェクトスコープ）
Write-Host "`n[3/5] MCP サーバー設定..." -ForegroundColor Yellow
Write-Host "  .mcp.json は既に含まれています（drawio, sequential-thinking, filesystem）" -ForegroundColor Green

# ユーザースコープの MCP（手動設定案内）
Write-Host "`n[4/5] ユーザースコープ MCP サーバー（手動追加が必要）:" -ForegroundColor Yellow
Write-Host @"
  以下のコマンドを実行してください:

  # GitHub 連携（YOUR_TOKEN を実際のトークンに置換）
  claude mcp add-json github '{"command":"npx","args":["-y","@modelcontextprotocol/server-github"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"YOUR_TOKEN"}}' --scope user

  # Context7（最新ドキュメント参照）
  claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp@latest
"@ -ForegroundColor Gray

# Git 初期化
Write-Host "`n[5/5] Git 初期化..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "  Git リポジトリは既に初期化済みです" -ForegroundColor Green
} else {
    git init
    git add .
    git commit -m "chore: initial project setup with Claude Code configuration"
    Write-Host "  Git リポジトリを初期化しました" -ForegroundColor Green
}

Write-Host "`n=== セットアップ完了 ===" -ForegroundColor Cyan
Write-Host @"

次のステップ:
  1. cd C:\development
  2. claude            (Claude Code を起動)
  3. /mcp              (MCP サーバーの接続確認)
  4. /init             (CLAUDE.md の確認・更新)

カスタムコマンド:
  /project:new-feature [機能名]    新機能の実装
  /project:create-diagram [内容]   ダイアグラム作成
  /project:review                  コードレビュー
  /project:sprint-report           スプリントレポート

"@ -ForegroundColor White
