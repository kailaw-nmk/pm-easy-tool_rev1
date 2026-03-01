import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  pageId: string;
  lineId: string;
  onClose: () => void;
}

export function ScheduleLineEditorDialog({ pageId, lineId, onClose }: Props) {
  const { data, updateScheduleLine, deleteScheduleLine } = useScheduleStore();
  const tc = useThemeColors();

  const page = data?.pages.find((p) => p.id === pageId);
  const line = page?.scheduleLines?.find((l) => l.id === lineId);

  const [label, setLabel] = useState(line?.label ?? '');
  const [color, setColor] = useState(line?.color ?? '#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(line?.strokeWidth ?? 1.5);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>(line?.lineStyle ?? 'dashed');

  if (!line) return null;

  const handleSave = () => {
    updateScheduleLine(pageId, lineId, {
      label: label || undefined,
      color,
      strokeWidth,
      lineStyle,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteScheduleLine(pageId, lineId);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>スケジュールラインの編集</h3>
        <div className="field">
          <label>ラベル</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ラベル（任意）" />
        </div>
        <div className="field">
          <label>色</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            style={{ width: 48, height: 32, padding: 0, border: 'none', cursor: 'pointer' }}
          />
        </div>
        <div className="field">
          <label>線の太さ: {strokeWidth}px</label>
          <input type="range" min={0.5} max={10} step={0.5} value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <label>線の種類</label>
          <select
            value={lineStyle}
            onChange={(e) => setLineStyle(e.target.value as 'solid' | 'dashed' | 'dotted')}
            style={{
              width: '100%', padding: '8px 10px',
              border: `1px solid ${tc.inputBorder}`, borderRadius: '6px',
              fontSize: '14px', background: tc.inputBg, color: tc.textPrimary,
            }}
          >
            <option value="solid">実線</option>
            <option value="dashed">破線</option>
            <option value="dotted">点線</option>
          </select>
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
