---
name: drawio-diagrams
description: draw.io ダイアグラムの作成。フローチャート、アーキテクチャ図、
  WBS、ガントチャート、シーケンス図、ER図、ネットワーク図などに対応。
---

# draw.io ダイアグラム作成スキル

## 基本ルール
- ファイルは `docs/diagrams/` に `.drawio` 拡張子で保存
- ファイル名は kebab-case（例: system-architecture.drawio）
- 日本語ラベルを使用
- 色はプロジェクト共通パレットに従う:
  - プライマリ: #1e88e5（青）
  - セカンダリ: #43a047（緑）
  - 警告: #fb8c00（オレンジ）
  - エラー: #e53935（赤）
  - 背景: #f5f5f5（グレー）

## PM 関連ダイアグラム
要求に応じて以下を作成可能:
- WBS（Work Breakdown Structure）
- ガントチャート風タイムライン
- RACI マトリクス
- リスクマトリクス
- ステークホルダーマップ
- システムアーキテクチャ図
- データフロー図
- ER 図
- シーケンス図
- 画面遷移図

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
        <!-- ここにシェイプとコネクタを追加 -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## drawio MCP ツールを使用
drawio-mcp-server のツールを活用してダイアグラムを構築する。
MCP が利用できない場合は、上記 XML 形式で直接 .drawio ファイルを生成する。
