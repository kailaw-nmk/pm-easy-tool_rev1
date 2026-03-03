import { useState, useCallback } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  onClose: () => void;
}

export function ExportPageDialog({ onClose }: Props) {
  const { data, downloadData, downloadPartial } = useScheduleStore();
  const tc = useThemeColors();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pages = data?.pages ?? [];

  const togglePage = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
  }, [pages]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDownloadAll = async () => {
    await downloadData();
    onClose();
  };

  const handleDownloadPartial = async () => {
    if (selectedIds.size === 0) return;
    await downloadPartial(Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3>エクスポート</h3>

        <div className="field" style={{ marginTop: 8 }}>
          <label>ページ選択（部分エクスポート用）</label>
          <div style={{
            background: tc.surfaceSecondary, borderRadius: 4, padding: 8,
            maxHeight: 240, overflowY: 'auto', marginTop: 4,
          }}>
            {pages.map((page) => (
              <label
                key={page.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, cursor: 'pointer', padding: '3px 0',
                  color: tc.textPrimary,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(page.id)}
                  onChange={() => togglePage(page.id)}
                />
                <span>{page.name}</span>
                <span style={{ marginLeft: 'auto', color: tc.textMuted, fontSize: 11 }}>
                  {page.swimLanes.length} レーン
                </span>
              </label>
            ))}
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
              {selectedIds.size}件選択中
            </span>
          </div>
        </div>

        <div className="actions">
          <button onClick={onClose}>キャンセル</button>
          <button onClick={handleDownloadAll}>
            全体DL
          </button>
          <button
            className="primary"
            onClick={handleDownloadPartial}
            disabled={selectedIds.size === 0}
          >
            選択ページDL
          </button>
        </div>
      </div>
    </div>
  );
}
