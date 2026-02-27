import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { COLOR_MAP } from '../lib/color-map';
import type { BarColor } from '../types/schedule';

interface Props {
  pageId: string;
  laneId: string;
  barId: string;
  onClose: () => void;
}

const BAR_COLORS: BarColor[] = ['blue', 'pink', 'green', 'orange', 'gray', 'purple', 'red', 'security'];

export function BarEditorDialog({ pageId, laneId, barId, onClose }: Props) {
  const { data, updateBar, deleteBar } = useScheduleStore();

  const page = data?.pages.find((p) => p.id === pageId);
  const lane = page?.swimLanes.find((l) => l.id === laneId);
  const bar = lane?.bars.find((b) => b.id === barId);

  const [label, setLabel] = useState(bar?.label ?? '');
  const [startMonth, setStartMonth] = useState((bar?.startMonth ?? '').substring(0, 7));
  const [endMonth, setEndMonth] = useState((bar?.endMonth ?? '').substring(0, 7));
  const [color, setColor] = useState<BarColor>(bar?.color ?? 'blue');
  const [tooltip, setTooltip] = useState(bar?.tooltip ?? '');
  const [memo, setMemo] = useState(bar?.memo ?? '');

  if (!bar) return null;

  const handleSave = () => {
    updateBar(pageId, laneId, barId, {
      label, startMonth, endMonth, color,
      tooltip: tooltip || undefined,
      memo: memo || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteBar(pageId, laneId, barId);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Bar</h3>
        <div className="field">
          <label>Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="field">
          <label>Start Month (YYYY-MM)</label>
          <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
        </div>
        <div className="field">
          <label>End Month (YYYY-MM)</label>
          <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} />
        </div>
        <div className="field">
          <label>Color</label>
          <div className="color-picker">
            {BAR_COLORS.map((c) => (
              <div
                key={c}
                className={`color-swatch ${c === color ? 'selected' : ''}`}
                style={{ background: COLOR_MAP[c].fill, borderColor: c === color ? COLOR_MAP[c].stroke : 'transparent' }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>
        <div className="field">
          <label>Tooltip</label>
          <input value={tooltip} onChange={(e) => setTooltip(e.target.value)} placeholder="ホバー時に表示するテキスト" />
        </div>
        <div className="field">
          <label>Memo</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="メモ・補足情報"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }} />
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
