import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { getColorMap } from '../lib/color-map';
import { useUIStore } from '../hooks/useUIStore';
import { useThemeColors } from '../hooks/useThemeColors';
import type { BarColor } from '../types/schedule';

interface Props {
  type: 'bar' | 'milestone';
  onClose: () => void;
}

const BAR_COLORS: BarColor[] = ['blue', 'pink', 'green', 'orange', 'gray', 'purple', 'red', 'security'];

export function AddItemPanel({ type, onClose }: Props) {
  const { data, currentPageId, addBar, addMilestone } = useScheduleStore();
  const themeMode = useUIStore((s) => s.themeMode);
  const tc = useThemeColors();
  const colorMap = getColorMap(themeMode);
  const page = data?.pages.find((p) => p.id === currentPageId);
  const timeline = page?.timeline ?? data?.timeline;
  const lanes = page?.swimLanes ?? [];

  const [label, setLabel] = useState(type === 'bar' ? '新規バー' : '★ 新規');
  const [laneId, setLaneId] = useState(lanes[0]?.id ?? '');
  const [startMonth, setStartMonth] = useState(timeline?.startDate ?? '2026-01');
  const [endMonth, setEndMonth] = useState(() => {
    if (!timeline) return '2026-04';
    const [y, m] = timeline.startDate.split('-').map(Number);
    const total = y * 12 + m - 1 + 3;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
  });
  const [date, setDate] = useState(timeline?.startDate ?? '2026-01');
  const [color, setColor] = useState<BarColor>('blue');

  if (!page || !timeline) return null;

  const handleAdd = () => {
    if (!laneId) return;
    if (type === 'bar') {
      addBar(currentPageId, laneId, {
        id: `bar_new_${Date.now()}`,
        label,
        startMonth,
        endMonth,
        color,
        yOffsetInLane: 10,
        heightPx: 22,
      });
    } else {
      addMilestone(currentPageId, laneId, {
        id: `ms_new_${Date.now()}`,
        label,
        date,
        yOffsetInLane: 10,
      });
    }
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="add-item-panel" onClick={(e) => e.stopPropagation()}>
        <h3>{type === 'bar' ? 'バーを追加' : 'マイルストンを追加'}</h3>

        <div className="field">
          <label>{type === 'bar' ? 'アイテム名' : 'マイルストン名'}</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
        </div>

        <div className="field">
          <label>対象レーン</label>
          <select value={laneId} onChange={(e) => setLaneId(e.target.value)}>
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>{lane.label.replace(/\n/g, ' ')}</option>
            ))}
          </select>
        </div>

        {type === 'bar' ? (
          <>
            <div className="field">
              <label>開始日</label>
              <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
            </div>
            <div className="field">
              <label>終了日</label>
              <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} />
            </div>
            <div className="field">
              <label>カラー</label>
              <div className="color-picker">
                {BAR_COLORS.map((c) => (
                  <div
                    key={c}
                    className={`color-swatch ${c === color ? 'selected' : ''}`}
                    style={{
                      background: colorMap[c].fill,
                      borderColor: c === color ? tc.accent : 'transparent',
                    }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="field">
            <label>日付</label>
            <input type="month" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}

        <div className="actions">
          <button onClick={onClose}>キャンセル</button>
          <button className="primary" onClick={handleAdd}>追加</button>
        </div>
      </div>
    </div>
  );
}
