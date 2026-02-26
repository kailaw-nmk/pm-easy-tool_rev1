# Coding Standards

## TypeScript
- strict mode を常に有効にする
- any 型の使用を禁止（unknown を使用）
- 型推論に頼りすぎず、関数の引数と戻り値には明示的に型を付ける
- enum より union type を優先する

## React
- 関数コンポーネント + Hooks のみ使用（クラスコンポーネント禁止）
- コンポーネントは1ファイル1コンポーネント
- Props の型定義はコンポーネントと同じファイルに記述
- カスタムフックは `use` プレフィックス必須

## Naming
- ファイル名: kebab-case（例: user-profile.tsx）
- コンポーネント名: PascalCase（例: UserProfile）
- 関数・変数: camelCase
- 定数: UPPER_SNAKE_CASE
- 型・インターフェース: PascalCase

## Import Order
1. React / Next.js
2. 外部ライブラリ
3. 内部モジュール（@/ エイリアス）
4. 相対パス
5. 型のインポート（type import）
