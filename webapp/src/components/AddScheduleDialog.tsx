import { useState, useMemo } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';

interface Props {
  onClose: () => void;
}

export function AddScheduleDialog({ onClose }: Props) {
  const { data, addPage } = useScheduleStore();
  const [name, setName] = useState('');

  // Collect all unique tags from the lane registry
  const allTags = useMemo(() => {
    const registry = data?.laneRegistry ?? [];
    const tagSet = new Set<string>();
    for (const tmpl of registry) {
      for (const tag of tmpl.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [data?.laneRegistry]);

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  // Preview: which templates would be included
  const previewLanes = useMemo(() => {
    const registry = data?.laneRegistry ?? [];
    const tags = Array.from(selectedTags);
    return registry.filter((tmpl) => {
      if (tmpl.tags.length === 0) return true; // no tags = always included
      return tmpl.tags.some((t) => tags.includes(t));
    });
  }, [data?.laneRegistry, selectedTags]);

  const handleCreate = () => {
    if (!name.trim()) return;
    addPage(name.trim(), Array.from(selectedTags));
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
        <h3>新規スケジュール作成</h3>
        <div className="field">
          <label>スケジュール名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 新規プロジェクト"
            autoFocus
          />
        </div>

        {allTags.length > 0 && (
          <div className="field">
            <label>含めるタグ（チェックしたタグのレーンが初期配置されます）</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {allTags.map((tag) => (
                <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedTags.has(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  <span className="tag-chip" style={{ cursor: 'pointer' }}>{tag}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="field" style={{ marginTop: 12 }}>
          <label>含まれるレーン（プレビュー）</label>
          <div style={{ background: '#f5f5f5', borderRadius: 4, padding: 8, fontSize: 12, color: '#555', maxHeight: 120, overflowY: 'auto' }}>
            {previewLanes.length === 0 ? (
              <span>レーンなし</span>
            ) : (
              previewLanes.map((tmpl) => (
                <div key={tmpl.id} style={{ padding: '2px 0' }}>
                  {tmpl.label}
                  {tmpl.tags.length > 0 && (
                    <span style={{ marginLeft: 8, color: '#999' }}>
                      [{tmpl.tags.join(', ')}]
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="actions">
          <button onClick={onClose}>キャンセル</button>
          <button className="primary" onClick={handleCreate} disabled={!name.trim()}>
            作成
          </button>
        </div>
      </div>
    </div>
  );
}
