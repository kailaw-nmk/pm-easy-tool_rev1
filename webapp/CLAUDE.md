# PM Tool Web Application

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict)
- UI: React 19 + Tailwind CSS + shadcn/ui
- DB: SQLite (開発) / PostgreSQL (本番)
- ORM: Prisma
- Auth: NextAuth.js
- Test: Vitest + React Testing Library

## Architecture
- app/ 配下は App Router のファイルベースルーティング
- Server Components をデフォルトで使用
- Client Components は "use client" を明示
- API は Route Handlers (app/api/) を使用

## PM ツール機能（予定）
- プロジェクト一覧・管理
- タスク管理（かんばん / リスト表示）
- ガントチャート表示
- WBS 管理
- リスク管理
- メンバー管理
- ダッシュボード（進捗可視化）

## Commands
- dev: `npm run dev`
- build: `npm run build`
- test: `npx vitest`
- db migrate: `npx prisma migrate dev`
- db studio: `npx prisma studio`
