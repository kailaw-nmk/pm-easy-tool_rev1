import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  pageId: string;
  laneId: string;
  onClose: () => void;
}

export function LaneTagEditor({ pageId, laneId, onClose }: Props) {
  const { data, updateLaneTags } = useScheduleStore();
  const tc = useThemeColors();
  const page = data?.pages.find((p) => p.id === pageId);
  const lane = page?.swimLanes.find((l) => l.id === laneId);

  const [tags, setTags] = useState<string[]>(lane?.tags ?? []);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInput('');
  };

  const handleRemove = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleSave = () => {
    updateLaneTags(pageId, laneId, tags);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>タグ編集 — {lane?.label}</h3>
        <div className="tag-chip-list">
          {tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
              <button className="tag-chip-remove" onClick={() => handleRemove(tag)}>×</button>
            </span>
          ))}
        </div>
        <div className="field" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タグを入力..."
            style={{ flex: 1 }}
          />
          <button onClick={handleAdd} className="primary"
            style={{
              padding: '8px 16px',
              border: `1px solid ${tc.accent}`, borderRadius: 6,
              background: tc.accent, color: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            追加
          </button>
        </div>
        <div className="actions">
          <button onClick={onClose}>キャンセル</button>
          <button className="primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
