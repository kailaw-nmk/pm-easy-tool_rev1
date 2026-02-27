---
name: drawio-diagrams
description: draw.io ダイアグラムの作成・編集。フローチャート、構成図、
  業務フロー、ER図、シーケンス図、組織図、ネットワーク図、WBS等に対応。
  「図」「ダイアグラム」「フロー」「構成図」「.drawio」が含まれる場合に使用。
---

# draw.io ダイアグラム作成スキル

## 基本ルール
- ファイル拡張子: `.drawio`
- ファイル名: kebab-case（日本語可、例: 業務フロー-受注処理.drawio）
- ラベル: 日本語
- 保存先: 作業中のサブディレクトリ内

## カラーパレット
- プライマリ: #1e88e5（青）
- セカンダリ: #43a047（緑）
- 注意: #fb8c00（オレンジ）
- エラー/重要: #e53935（赤）
- 背景/コンテナ: #f5f5f5（グレー）
- テキスト: #333333

## 対応ダイアグラム
- 業務フロー / プロセスフロー
- システム構成図 / アーキテクチャ図
- ネットワーク構成図
- ER図（データベース設計）
- シーケンス図
- 画面遷移図
- 組織図
- WBS（Work Breakdown Structure）
- RACI マトリクス
- ガントチャート風タイムライン
- マインドマップ
- 比較図 / マトリクス

## draw.io XML 基本構造
```xml
<mxfile host="app.diagrams.net">
  <diagram id="unique-id" name="Page-1">
    <mxGraphModel dx="1434" dy="759" grid="1" gridSize="10"
      guides="1" tooltips="1" connect="1" arrows="1"
      fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- シェイプとコネクタ -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## ツール優先順位
1. drawio-mcp-server のツールを使用（利用可能な場合）
2. MCP 不可時は上記 XML 形式で .drawio ファイルを直接生成
