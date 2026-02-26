# PM Conventions

## ドキュメント管理
- 要件定義書は `docs/requirements/` に配置
- 設計書は `docs/design/` に配置
- ダイアグラムは `docs/diagrams/` に `.drawio` 形式で保存
- 議事録は `docs/meeting-notes/` に `YYYY-MM-DD-topic.md` 形式で保存

## ダイアグラム命名規則
- kebab-case を使用
- 種類をプレフィックスに付ける
  - `arch-` : アーキテクチャ図
  - `flow-` : フローチャート
  - `seq-` : シーケンス図
  - `er-` : ER 図
  - `wbs-` : WBS
  - `screen-` : 画面遷移図
- 例: `arch-system-overview.drawio`, `flow-user-registration.drawio`

## タスク管理
- Issue タイトルは日本語可
- ラベルで分類: `feature`, `bug`, `docs`, `design`, `infra`
- 優先度: `P0`(緊急), `P1`(高), `P2`(中), `P3`(低)

## Git ブランチ命名
- `feature/` : 新機能
- `fix/` : バグ修正
- `docs/` : ドキュメント
- `refactor/` : リファクタリング
- `chore/` : 雑務
