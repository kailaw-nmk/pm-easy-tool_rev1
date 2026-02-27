# C:\development - 汎用業務ワークスペース

Claude Code を使った各種業務資料の作成・調査用ワークスペース。

## 使い方

```powershell
cd C:\development
claude
```

サブディレクトリを案件ごとに作成し、関連資料をまとめて作業する。

## カスタムコマンド

| コマンド | 用途 |
|---|---|
| `/project:new-workspace [テーマ]` | 新しい作業ディレクトリを作成 |
| `/project:create-doc [内容]` | ドキュメント作成（docx/xlsx/pptx/pdf/md） |
| `/project:create-diagram [内容]` | draw.io ダイアグラム作成 |
| `/project:analyze [対象]` | 資料の調査・分析 |
| `/project:convert [対象]` | ファイル形式変換 |

## MCP サーバー

| サーバー | 用途 |
|---|---|
| drawio-mcp-server | draw.io ダイアグラム作成・編集 |
| sequential-thinking | 複雑なタスクの段階的分解 |

## ディレクトリ例

```
C:\development\
├── 契約書レビュー/
│   ├── 元契約書.pdf
│   └── レビューメモ.docx
├── 2026Q1-事業計画/
│   ├── 事業計画書.pptx
│   └── 収支計画.xlsx
├── システム設計-顧客管理/
│   ├── 要件定義.md
│   ├── er-顧客管理.drawio
│   └── flow-受注処理.drawio
└── ...
```
