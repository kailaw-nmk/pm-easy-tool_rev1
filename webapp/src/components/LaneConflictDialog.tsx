import { useState } from 'react';
import { useThemeColors } from '../hooks/useThemeColors';
import type { LaneConflict, LaneConflictResolution } from '../types/schedule';

interface Props {
  conflicts: LaneConflict[];
  onConfirm: (resolutions: Map<string, LaneConflictResolution>) => void;
  onClose: () => void;
}

export function LaneConflictDialog({ conflicts, onConfirm, onClose }: Props) {
  const tc = useThemeColors();
  const [resolutions, setResolutions] = useState<Map<string, LaneConflictResolution>>(() => {
    const map = new Map<string, LaneConflictResolution>();
    for (const c of conflicts) {
      map.set(c.registryId, 'keep-existing');
    }
    return map;
  });

  const handleChange = (registryId: string, resolution: LaneConflictResolution) => {
    setResolutions((prev) => {
      const next = new Map(prev);
      next.set(registryId, resolution);
      return next;
    });
  };

  const cellStyle: React.CSSProperties = {
    flex: 1, padding: '6px 8px', fontSize: 12, color: tc.textPrimary,
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <h3>インポート - レーン内容の競合</h3>
        <p style={{ fontSize: 13, color: tc.textMuted, margin: '8px 0 12px' }}>
          同名レーンの内容が異なります。各レーンについてどちらの内容を使用するか選択してください。
        </p>

        <div style={{
          background: tc.surfaceSecondary, borderRadius: 4, padding: 8,
          maxHeight: 360, overflowY: 'auto',
        }}>
          {conflicts.map((c) => (
            <div key={c.registryId} style={{
              padding: '8px 0', borderBottom: `1px solid ${tc.inputBorder}`,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: tc.textPrimary }}>
                {c.templateLabel}
              </div>

              {/* Comparison table */}
              <div style={{
                display: 'flex', gap: 0, marginBottom: 8,
                border: `1px solid ${tc.inputBorder}`, borderRadius: 4, overflow: 'hidden',
              }}>
                {/* Header column */}
                <div style={{ width: 90, flexShrink: 0 }}>
                  <div style={{ ...cellStyle, fontWeight: 600, background: tc.surfaceSecondary, borderBottom: `1px solid ${tc.inputBorder}` }}>&nbsp;</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>バー数</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>MS数</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>高さ</div>
                  <div style={{ ...cellStyle }}>ページ</div>
                </div>
                {/* Existing column */}
                <div style={{ flex: 1, borderLeft: `1px solid ${tc.inputBorder}` }}>
                  <div style={{ ...cellStyle, fontWeight: 600, background: tc.surfaceSecondary, borderBottom: `1px solid ${tc.inputBorder}` }}>既存</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>{c.existingInfo.barCount}</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>{c.existingInfo.milestoneCount}</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>{c.existingInfo.heightPx}px</div>
                  <div style={{ ...cellStyle, fontSize: 11 }}>{c.existingInfo.pageNames.join(', ')}</div>
                </div>
                {/* Imported column */}
                <div style={{ flex: 1, borderLeft: `1px solid ${tc.inputBorder}` }}>
                  <div style={{ ...cellStyle, fontWeight: 600, background: tc.surfaceSecondary, borderBottom: `1px solid ${tc.inputBorder}` }}>インポート</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>{c.importedInfo.barCount}</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>{c.importedInfo.milestoneCount}</div>
                  <div style={{ ...cellStyle, borderBottom: `1px solid ${tc.inputBorder}` }}>{c.importedInfo.heightPx}px</div>
                  <div style={{ ...cellStyle, fontSize: 11 }}>{c.importedInfo.pageNames.join(', ')}</div>
                </div>
              </div>

              {/* Radio buttons */}
              <div style={{ display: 'flex', gap: 16 }}>
                {([
                  ['keep-existing', '既存を維持'],
                  ['use-imported', 'インポート版を使用'],
                ] as [LaneConflictResolution, string][]).map(([value, label]) => (
                  <label key={value} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, cursor: 'pointer', color: tc.textPrimary,
                  }}>
                    <input
                      type="radio"
                      name={`lane-res-${c.registryId}`}
                      value={value}
                      checked={resolutions.get(c.registryId) === value}
                      onChange={() => handleChange(c.registryId, value)}
                      style={{ cursor: 'pointer' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="actions">
          <button onClick={onClose}>キャンセル</button>
          <button className="primary" onClick={() => onConfirm(resolutions)}>
            インポート実行
          </button>
        </div>
      </div>
    </div>
  );
}
