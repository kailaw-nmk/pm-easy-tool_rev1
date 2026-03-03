import { useState, useMemo, useCallback } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  onClose: () => void;
}

export function AddScheduleDialog({ onClose }: Props) {
  const { data, addPage } = useScheduleStore();
  const tc = useThemeColors();
  const [name, setName] = useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [filterScheduleName, setFilterScheduleName] = useState('');

  const registry = data?.laneRegistry ?? [];

  // Collect existing schedule names for the filter dropdown
  const scheduleNames = useMemo(() => {
    const names = (data?.pages ?? []).map((p) => p.name);
    return Array.from(new Set(names)).sort();
  }, [data?.pages]);

  // Filter templates based on schedule name filter and text search
  const filteredTemplates = useMemo(() => {
    return registry.filter((tmpl) => {
      // Schedule name filter
      if (filterScheduleName && !tmpl.tags.includes(filterScheduleName)) {
        return false;
      }
      // Text search
      if (searchText && !tmpl.label.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [registry, filterScheduleName, searchText]);

  const toggleTemplate = useCallback((id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      for (const tmpl of filteredTemplates) {
        next.add(tmpl.id);
      }
      return next;
    });
  }, [filteredTemplates]);

  const handleDeselectAll = useCallback(() => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      for (const tmpl of filteredTemplates) {
        next.delete(tmpl.id);
      }
      return next;
    });
  }, [filteredTemplates]);

  const handleFilterChange = useCallback((scheduleName: string) => {
    setFilterScheduleName(scheduleName);
    if (scheduleName) {
      // Auto-preselect templates matching this schedule
      const matching = registry.filter((tmpl) => tmpl.tags.includes(scheduleName));
      setSelectedTemplateIds((prev) => {
        const next = new Set(prev);
        for (const tmpl of matching) {
          next.add(tmpl.id);
        }
        return next;
      });
    }
  }, [registry]);

  const handleCreate = () => {
    if (!name.trim()) return;
    addPage(name.trim(), Array.from(selectedTemplateIds));
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
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

        <div className="field" style={{ marginTop: 12 }}>
          <label>フィルタ</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <select
              value={filterScheduleName}
              onChange={(e) => handleFilterChange(e.target.value)}
              style={{
                flex: 1, padding: '4px 8px', fontSize: 13,
                background: tc.inputBg, color: tc.textPrimary,
                border: `1px solid ${tc.inputBorder}`, borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              <option value="">既存スケジュール名で絞込</option>
              {scheduleNames.map((sn) => (
                <option key={sn} value={sn}>{sn}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="テキスト検索"
              style={{
                flex: 1, padding: '4px 8px', fontSize: 13,
                background: tc.inputBg, color: tc.textPrimary,
                border: `1px solid ${tc.inputBorder}`, borderRadius: 4,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>レーン選択</label>
          <div style={{
            background: tc.surfaceSecondary, borderRadius: 4, padding: 8,
            maxHeight: 200, overflowY: 'auto', marginTop: 4,
          }}>
            {filteredTemplates.length === 0 ? (
              <span style={{ fontSize: 12, color: tc.textMuted }}>該当するレーンなし</span>
            ) : (
              filteredTemplates.map((tmpl) => (
                <label
                  key={tmpl.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, cursor: 'pointer', padding: '3px 0',
                    color: tc.textPrimary,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTemplateIds.has(tmpl.id)}
                    onChange={() => toggleTemplate(tmpl.id)}
                  />
                  <span>{tmpl.label}</span>
                  {tmpl.tags.length > 0 && (
                    <span style={{ marginLeft: 'auto', color: tc.textMuted, fontSize: 11 }}>
                      [{tmpl.tags.join(', ')}]
                    </span>
                  )}
                  {tmpl.tags.length === 0 && (
                    <span style={{ marginLeft: 'auto', color: tc.textMuted, fontSize: 11 }}>
                      (タグなし)
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={handleSelectAll}
              style={{ fontSize: 12, padding: '2px 10px', cursor: 'pointer' }}
            >
              全選択
            </button>
            <button
              onClick={handleDeselectAll}
              style={{ fontSize: 12, padding: '2px 10px', cursor: 'pointer' }}
            >
              全解除
            </button>
            <span style={{ fontSize: 12, color: tc.textMuted, marginLeft: 'auto', alignSelf: 'center' }}>
              {selectedTemplateIds.size}件選択中
            </span>
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
