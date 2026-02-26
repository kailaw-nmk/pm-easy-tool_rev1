# Project: PM Tool Development

## Overview
プロジェクトマネジメント用 Web アプリケーションの開発プロジェクト。
ドキュメント調査、設計図作成、システム開発を一貫して行う。

## Language
- コミュニケーション: 日本語
- コード・コミット: 英語

## Project Structure
- `docs/` : 各種ドキュメント（要件、設計、議事録）
- `docs/diagrams/` : draw.io ダイアグラム出力先
- `webapp/` : PM ツール本体（詳細は webapp/CLAUDE.md 参照）
- `scripts/` : ユーティリティ

## Key Commands
- ビルド: `cd webapp && npm run build`
- テスト: `cd webapp && npm test`
- Lint: `cd webapp && npm run lint`
- 型チェック: `cd webapp && npx tsc --noEmit`

## Workflow
- 作業前に必ず新しい Git ブランチを作成する
- コミットメッセージは Conventional Commits 形式
- draw.io ファイルは `docs/diagrams/` に保存する
- 設計判断はドキュメントに残す

## Code Style
- TypeScript strict mode
- 関数コンポーネント + Hooks（React）
- ESM (import/export) を使用
