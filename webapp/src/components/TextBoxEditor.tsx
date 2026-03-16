import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import type { TextBox } from '../types/schedule';

interface Props {
  pageId: string;
  textBoxId: string;
  onClose: () => void;
}

export function TextBoxEditorDialog({ pageId, textBoxId, onClose }: Props) {
  const { data, updateTextBox, deleteTextBox } = useScheduleStore();

  const page = data?.pages.find((p) => p.id === pageId);
  const textBox = page?.textBoxes?.find((t) => t.id === textBoxId);

  const [text, setText] = useState(textBox?.text ?? '');
  const [fontSize, setFontSize] = useState(textBox?.fontSize ?? 12);
  const [textColor, setTextColor] = useState(textBox?.textColor ?? '#333333');
  const [fillColor, setFillColor] = useState(textBox?.fillColor ?? '#ffffffcc');
  const [borderColor, setBorderColor] = useState(textBox?.borderColor ?? '#888888');
  const [borderWidth, setBorderWidth] = useState(textBox?.borderWidth ?? 1);
  const [arrowTargetItemId, setArrowTargetItemId] = useState(textBox?.arrowTargetItemId ?? '');
  const [arrowColor, setArrowColor] = useState(textBox?.arrowColor ?? '#888888');
  const [arrowStrokeWidth, setArrowStrokeWidth] = useState(textBox?.arrowStrokeWidth ?? 1.5);

  if (!textBox) return null;

  // Build list of all items for arrow target selection
  const allItems: { id: string; laneId: string; label: string }[] = [];
  if (page) {
    for (const lane of page.swimLanes) {
      for (const bar of lane.bars) {
        allItems.push({ id: bar.id, laneId: lane.id, label: `[Bar] ${bar.label} (${lane.label})` });
      }
      for (const ms of lane.milestones) {
        allItems.push({ id: ms.id, laneId: lane.id, label: `[MS] ${ms.label} (${lane.label})` });
      }
    }
  }

  const handleSave = () => {
    const selectedItem = allItems.find((item) => item.id === arrowTargetItemId);
    const updates: Partial<TextBox> = {
      text,
      fontSize,
      textColor,
      fillColor,
      borderColor,
      borderWidth,
      arrowTargetItemId: arrowTargetItemId || undefined,
      arrowTargetLaneId: selectedItem?.laneId ?? undefined,
      arrowColor: arrowTargetItemId ? arrowColor : undefined,
      arrowStrokeWidth: arrowTargetItemId ? arrowStrokeWidth : undefined,
    };
    updateTextBox(pageId, textBoxId, updates);
    onClose();
  };

  const handleDelete = () => {
    deleteTextBox(pageId, textBoxId);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>テキストボックスの編集</h3>
        <div className="field">
          <label>テキスト</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div className="field">
          <label>フォントサイズ: {fontSize}px</label>
          <input type="range" min={6} max={48} step={1} value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field" style={{ display: 'flex', gap: 16 }}>
          <div>
            <label>文字色</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
              style={{ width: 48, height: 32, padding: 0, border: 'none', cursor: 'pointer', display: 'block' }}
            />
          </div>
          <div>
            <label>塗り色</label>
            <input type="color" value={fillColor.replace(/cc$/, '')} onChange={(e) => setFillColor(e.target.value + 'cc')}
              style={{ width: 48, height: 32, padding: 0, border: 'none', cursor: 'pointer', display: 'block' }}
            />
          </div>
          <div>
            <label>枠線色</label>
            <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)}
              style={{ width: 48, height: 32, padding: 0, border: 'none', cursor: 'pointer', display: 'block' }}
            />
          </div>
        </div>
        <div className="field">
          <label>枠線太さ: {borderWidth}px</label>
          <input type="range" min={0} max={5} step={0.5} value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <label>矢印ターゲット</label>
          <select
            value={arrowTargetItemId}
            onChange={(e) => setArrowTargetItemId(e.target.value)}
            style={{ width: '100%', padding: '6px 8px' }}
          >
            <option value="">なし</option>
            {allItems.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>
        {arrowTargetItemId && (
          <div className="field" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <label>矢印色</label>
              <input type="color" value={arrowColor} onChange={(e) => setArrowColor(e.target.value)}
                style={{ width: 48, height: 32, padding: 0, border: 'none', cursor: 'pointer', display: 'block' }}
              />
            </div>
            <div>
              <label>矢印太さ: {arrowStrokeWidth}px</label>
              <input type="range" min={0.5} max={5} step={0.5} value={arrowStrokeWidth}
                onChange={(e) => setArrowStrokeWidth(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
        <div className="actions">
          <button className="danger" onClick={handleDelete}>Delete</button>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
