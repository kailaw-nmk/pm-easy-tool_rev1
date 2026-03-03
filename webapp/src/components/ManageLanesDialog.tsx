import { useState, useMemo, useCallback } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  pageId: string;
  onClose: () => void;
}

export function ManageLanesDialog({ pageId, onClose }: Props) {
  const { data, addLaneFromTemplate, removeLane } = useScheduleStore();
  const tc = useThemeColors();
  const [searchText, setSearchText] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const page = data?.pages.find((p) => p.id === pageId);
  const registry = data?.laneRegistry ?? [];

  // Collect registryIds already used in this page
  const usedRegistryIds = useMemo(() => {
    if (!page) return new Set<string>();
    return new Set(
      page.swimLanes
        .filter((l) => l.registryId)
        .map((l) => l.registryId!)
    );
  }, [page]);

  // Available templates (not yet used in this page)
  const availableTemplates = useMemo(() => {
    return registry
      .filter((tmpl) => !usedRegistryIds.has(tmpl.id))
      .filter((tmpl) => {
        if (!searchText) return true;
        return tmpl.label.toLowerCase().includes(searchText.toLowerCase());
      });
  }, [registry, usedRegistryIds, searchText]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAddSelected = useCallback(() => {
    for (const templateId of selectedToAdd) {
      addLaneFromTemplate(pageId, templateId);
    }
    setSelectedToAdd(new Set());
  }, [selectedToAdd, pageId, addLaneFromTemplate]);

  const handleRemoveLane = useCallback((laneId: string) => {
    removeLane(pageId, laneId);
  }, [pageId, removeLane]);

  if (!page) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
        <h3>レーン管理 — {page.name}</h3>

        <div className="field">
          <label>現在のレーン</label>
          <div style={{
            background: tc.surfaceSecondary, borderRadius: 4, padding: 8,
            maxHeight: 180, overflowY: 'auto', marginTop: 4,
          }}>
            {page.swimLanes.length === 0 ? (
              <span style={{ fontSize: 12, color: tc.textMuted }}>レーンなし</span>
            ) : (
              page.swimLanes.map((lane) => (
                <div
                  key={lane.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 0', fontSize: 13, color: tc.textPrimary,
                  }}
                >
                  <span>{lane.label}</span>
                  <button
                    onClick={() => handleRemoveLane(lane.id)}
                    style={{
                      padding: '2px 8px', fontSize: 11, cursor: 'pointer',
                      border: `1px solid ${tc.danger}`, borderRadius: 4,
                      background: 'transparent', color: tc.danger,
                    }}
                  >
                    削除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>追加可能なレーン</label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="テキスト検索"
            style={{
              width: '100%', padding: '4px 8px', fontSize: 13, marginTop: 4,
              background: tc.inputBg, color: tc.textPrimary,
              border: `1px solid ${tc.inputBorder}`, borderRadius: 4,
              fontFamily: 'inherit',
            }}
          />
          <div style={{
            background: tc.surfaceSecondary, borderRadius: 4, padding: 8,
            maxHeight: 160, overflowY: 'auto', marginTop: 4,
          }}>
            {availableTemplates.length === 0 ? (
              <span style={{ fontSize: 12, color: tc.textMuted }}>追加可能なレーンなし</span>
            ) : (
              availableTemplates.map((tmpl) => (
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
                    checked={selectedToAdd.has(tmpl.id)}
                    onChange={() => toggleSelect(tmpl.id)}
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
          {selectedToAdd.size > 0 && (
            <button
              onClick={handleAddSelected}
              className="primary"
              style={{ marginTop: 8, padding: '4px 16px', fontSize: 13, cursor: 'pointer' }}
            >
              選択したレーンを追加（{selectedToAdd.size}件）
            </button>
          )}
        </div>

        <div className="actions">
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
