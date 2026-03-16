import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';

interface Props {
  onClose: () => void;
}

export function FileMemoDialog({ onClose }: Props) {
  const { data, updateMemo } = useScheduleStore();
  const [text, setText] = useState(data?.memo ?? '');

  const handleSave = () => {
    updateMemo(text);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3>ファイルメモ</h3>
        <div className="field" style={{ marginTop: 8 }}>
          <label>このスケジュールファイルに対するメモ</label>
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例: 2026年1月時点の見積もりデータをもとに作成"
            style={{ width: '100%', resize: 'vertical', marginTop: 4 }}
          />
        </div>
        <div className="actions">
          <button onClick={onClose}>キャンセル</button>
          <button className="primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
