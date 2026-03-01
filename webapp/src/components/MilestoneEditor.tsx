import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  pageId: string;
  laneId: string;
  msId: string;
  onClose: () => void;
}

export function MilestoneEditorDialog({ pageId, laneId, msId, onClose }: Props) {
  const { data, updateMilestone, deleteMilestone } = useScheduleStore();
  const tc = useThemeColors();

  const page = data?.pages.find((p) => p.id === pageId);
  const lane = page?.swimLanes.find((l) => l.id === laneId);
  const ms = lane?.milestones.find((m) => m.id === msId);

  const [label, setLabel] = useState(ms?.label ?? '');
  const [date, setDate] = useState(ms?.date ?? '');
  const [tooltip, setTooltip] = useState(ms?.tooltip ?? '');
  const [memo, setMemo] = useState(ms?.memo ?? '');

  if (!ms) return null;

  const handleSave = () => {
    updateMilestone(pageId, laneId, msId, {
      label, date,
      tooltip: tooltip || undefined,
      memo: memo || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteMilestone(pageId, laneId, msId);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Milestone</h3>
        <div className="field">
          <label>Label</label>
          <textarea value={label} onChange={(e) => setLabel(e.target.value)} rows={2}
            style={{
              width: '100%', padding: '8px 10px',
              border: `1px solid ${tc.inputBorder}`, borderRadius: '6px',
              fontSize: '14px', fontFamily: 'inherit', resize: 'vertical',
              background: tc.inputBg, color: tc.textPrimary,
            }} />
        </div>
        <div className="field">
          <label>Date (YYYY-MM)</label>
          <input type="month" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Tooltip</label>
          <input value={tooltip} onChange={(e) => setTooltip(e.target.value)} placeholder="ホバー時に表示するテキスト" />
        </div>
        <div className="field">
          <label>Memo</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="メモ・補足情報"
            style={{
              width: '100%', padding: '8px 10px',
              border: `1px solid ${tc.inputBorder}`, borderRadius: '6px',
              fontSize: '14px', fontFamily: 'inherit', resize: 'vertical',
              background: tc.inputBg, color: tc.textPrimary,
            }} />
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
