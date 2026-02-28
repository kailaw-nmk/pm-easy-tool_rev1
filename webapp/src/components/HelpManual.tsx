import { useState } from 'react';

const sections = [
  {
    title: '概要',
    content: `Schedule Manager はブラウザだけで動くガントチャート管理ツールです。
インストール不要・サーバー送信なしで、プロジェクトの日程管理を行えます。

すべてのデータはブラウザの localStorage に保存されるため、
インターネット接続がなくてもオフラインで利用可能です。`,
  },
  {
    title: '基本操作',
    content: `■ バー（タスク）の追加
  ツールバーの「+ ▼」→「Bar」でダイアログから追加できます。
  または「配置 ▼」→「Bar」で配置モードに入り、チャート上をクリックして直接配置します。

■ マイルストーンの追加
  「+ ▼」→「Milestone」、または配置モードで同様に追加できます。

■ レーンの追加
  「+ ▼」→「Lane」で新しいスイムレーンを追加します。
  「+ ▼」→「レーン管理」でレーンテンプレートの管理が可能です。

■ 編集・移動
  バーやマイルストーンをドラッグして移動・リサイズできます。
  ダブルクリックで詳細編集ダイアログが開きます。
  右クリックでコンテキストメニュー（複製・削除など）が表示されます。

■ 選択
  クリックで単一選択、Ctrl+クリックで複数選択できます。
  Delete キーで選択中のアイテムを削除します。`,
  },
  {
    title: '接続（依存関係）',
    content: `■ 接続モード
  ツールバーの 🔗 ボタンで接続モードに入ります（カーソルが十字に変化）。

  1. アイテム（バーやマイルストーン）にマウスを近づけると、
     辺の上にスナップポイント（●）が表示されます。
  2. 始点のスナップポイントをクリック → 始点が確定（●がハイライト）
  3. 別アイテムのスナップポイントをクリック → 接続が作成されます。

  ESC キーまたは背景クリックで接続モードをキャンセルできます。

■ 従来の方法
  2つのアイテムを Ctrl+クリックで選択し、右クリックメニューから
  「接続を作成」を選ぶことでも接続できます。

■ 接続の編集
  接続線をダブルクリックで編集ダイアログ（色・メモ・線種など）が開きます。`,
  },
  {
    title: 'ズームと表示モード',
    content: `■ ズームレベル
  Day / Month / Q（四半期）/ Year の 4 段階で切り替えられます。

■ 表示モード
  Fixed: 固定列幅で表示します。
  Fit: ブラウザ幅に合わせてチャート全体を自動縮小/拡大します。
       文字サイズも幅に連動して自動調整されます。
       ※ Day ズームでは Fit モードは使用できません。

■ Today（📍）
  今日の日付の位置にチャートをスクロールします。`,
  },
  {
    title: 'エクスポート・インポート',
    content: `■ エクスポート
  ツールバーの「⋯ ▼」メニューから各種エクスポートが可能です：
  ・PNG: チャート画像として保存
  ・PDF: PDF ファイルとして保存
  ・Download: JSON 形式でデータファイルを保存

■ インポート
  「⋯ ▼」→「Import」で JSON ファイルを読み込み、
  以前保存したデータを復元できます。`,
  },
  {
    title: 'その他の機能',
    content: `■ Undo / Redo
  ↩ / ↪ ボタンで操作の取消・やり直しが可能です。

■ テーマ切替
  🌙 / ☀️ ボタンでライト/ダークテーマを切り替えます。

■ ⚙ 設定
  フォントサイズやタイムライン範囲の調整ができます。

■ 複数ページ
  タブでページを切り替え、複数のガントチャートを管理できます。

■ Tip / Memo
  ツールチップやメモアイコンの表示/非表示を切り替えます。`,
  },
  {
    title: 'データの安全性',
    content: `■ 完全ローカル動作
  すべてのデータはブラウザの localStorage に保存されます。
  外部サーバーへのデータ送信は一切行いません。

■ サーバーレス
  このアプリは静的ファイル（HTML/CSS/JS）のみで構成されており、
  バックエンドサーバーやデータベースを持ちません。

■ オフライン対応
  一度読み込めば、インターネット接続なしでも利用可能です。

■ データの管理
  定期的に「⋯ ▼」→「Download」でバックアップを推奨します。
  ブラウザのキャッシュクリアや localStorage 削除を行うと
  データが失われるため、バックアップが重要です。

■ 機密情報の取り扱い
  入力されたプロジェクト名・タスク名・メモ等の情報は
  すべてお使いのブラウザ内にのみ保存されます。
  第三者がアクセスすることはありません。`,
  },
];

interface Props {
  onClose: () => void;
}

export function HelpManual({ onClose }: Props) {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog help-manual-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="help-manual-header">
          <h3>使い方マニュアル</h3>
          <button className="context-menu-close" onClick={onClose}>✕</button>
        </div>
        <div className="help-manual-body">
          <nav className="help-manual-nav">
            {sections.map((s, i) => (
              <button
                key={i}
                className={activeSection === i ? 'active' : ''}
                onClick={() => setActiveSection(i)}
              >
                {s.title}
              </button>
            ))}
          </nav>
          <div className="help-manual-content">
            <h4>{sections[activeSection].title}</h4>
            <pre>{sections[activeSection].content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
