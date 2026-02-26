# PM Tool Development Project

プロジェクトマネジメント用 Web アプリケーション開発プロジェクト

## クイックスタート

```powershell
# 1. C:\development に展開
# 2. セットアップ実行
.\setup.ps1

# 3. Claude Code 起動
claude

# 4. MCP 接続確認
/mcp
```

## ディレクトリ構成

```
C:\development\
├── CLAUDE.md                  # Claude Code グローバル指示書
├── .mcp.json                  # MCP サーバー設定
├── .claude/
│   ├── settings.local.json    # 権限設定
│   ├── commands/              # カスタムスラッシュコマンド
│   ├── rules/                 # コーディング・PM ルール
│   └── skills/                # draw.io スキル等
├── docs/                      # ドキュメント
│   ├── requirements/          # 要件定義
│   ├── design/                # 設計書
│   ├── diagrams/              # draw.io ファイル
│   └── meeting-notes/         # 議事録
├── webapp/                    # PM ツール本体
└── scripts/                   # ユーティリティ
```

## MCP サーバー

| サーバー | スコープ | 用途 |
|---|---|---|
| drawio-mcp-server | project | draw.io ダイアグラム作成・編集 |
| sequential-thinking | project | 複雑なタスクの段階的分解 |
| filesystem | project | ファイル読み書き |
| server-github | user | GitHub Issue/PR 管理 |
| context7 | user | 最新ライブラリドキュメント参照 |

## カスタムコマンド

| コマンド | 用途 |
|---|---|
| `/project:new-feature [名前]` | 新機能の実装ワークフロー |
| `/project:create-diagram [内容]` | draw.io ダイアグラム作成 |
| `/project:review` | コードレビュー |
| `/project:sprint-report` | スプリントレポート作成 |

## 技術スタック（webapp）

- Next.js 15 (App Router) + TypeScript
- React 19 + Tailwind CSS + shadcn/ui
- Prisma + SQLite (開発) / PostgreSQL (本番)
- Vitest + React Testing Library
