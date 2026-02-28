# Schedule Manager

ブラウザで動くガントチャート管理ツール。React + Vite + TypeScript で構築。

## 機能

- ガントチャート表示（日 / 週 / 月 / 四半期のズーム切替）
- ドラッグ＆ドロップによるバー編集（移動・リサイズ）
- スイムレーン管理（追加・並び替え・グループ化）
- マイルストーン表示
- PNG / PDF エクスポート
- localStorage によるデータ自動保存
- ライト / ダークテーマ切替
- 固定幅 / 自動幅の表示モード

## 技術スタック

- **フロントエンド:** React 19 + TypeScript
- **ビルド:** Vite 6
- **状態管理:** Zustand
- **エクスポート:** html2canvas + jsPDF

## はじめかた

```bash
cd webapp
npm install
npm run dev
```

`http://localhost:5173` で起動します。

Windows の場合はルートの `start.bat` をダブルクリックでも起動できます。

## ビルド

```bash
cd webapp
npm run build
```

`webapp/dist/` に出力されます。

## デプロイ (Vercel)

Vercel の静的 SPA デプロイに対応しています。

- **Framework Preset:** Vite
- **Root Directory:** `webapp`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

クライアントサイドルーティング用のリライトは `webapp/vercel.json` で設定済みです。

## ライセンス

MIT
