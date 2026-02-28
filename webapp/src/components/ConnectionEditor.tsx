import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';
import type { ConnectionLineType } from '../types/schedule';

interface Props {
  pageId: string;
  connectionId: string;
  onClose: () => void;
}

export function ConnectionEditorDialog({ pageId, connectionId, onClose }: Props) {
  const { data, updateConnection, deleteConnection } = useScheduleStore();
  const tc = useThemeColors();

  const page = data?.pages.find((p) => p.id === pageId);
  const connection = page?.connections?.find((c) => c.id === connectionId);

  const [lineType, setLineType] = useState<ConnectionLineType>(connection?.lineType ?? 'orthogonal');
  const [memo, setMemo] = useState(connection?.memo ?? '');
  const [color, setColor] = useState(connection?.color ?? '#888888');
  const [strokeWidth, setStrokeWidth] = useState(connection?.strokeWidth ?? 1.5);

  if (!connection) return null;

  const handleSave = () => {
    updateConnection(pageId, connectionId, {
      lineType,
      memo: memo || undefined,
      color: color || undefined,
      strokeWidth,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteConnection(pageId, connectionId);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>接続の編集</h3>
        <div className="field">
          <label>線の種類</label>
          <select
            value={lineType}
            onChange={(e) => setLineType(e.target.value as ConnectionLineType)}
            style={{
              width: '100%', padding: '8px 10px',
              border: `1px solid ${tc.inputBorder}`, borderRadius: '6px',
              fontSize: '14px', background: tc.inputBg, color: tc.textPrimary,
            }}
          >
            <option value="orthogonal">直角線</option>
            <option value="straight">直線</option>
          </select>
        </div>
        <div className="field">
          <label>メモ</label>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="接続のメモ" />
        </div>
        <div className="field">
          <label>色</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            style={{ width: 48, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
          />
        </div>
        <div className="field">
          <label>線の太さ: {strokeWidth}px</label>
          <input type="range" min={0.5} max={30} step={0.5} value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="actions">
          <button className="danger" onClick={handleDelete}>Delete</button>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
