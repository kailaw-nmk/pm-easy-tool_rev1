import { useState } from 'react';
import { useThemeColors } from '../hooks/useThemeColors';
import type { SchedulePage, ConflictResolution } from '../types/schedule';

interface Props {
  conflicts: { pageName: string }[];
  nonConflicts: SchedulePage[];
  onConfirm: (resolutions: Map<string, ConflictResolution>) => void;
  onClose: () => void;
}

export function ImportConflictDialog({ conflicts, nonConflicts, onConfirm, onClose }: Props) {
  const tc = useThemeColors();
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(() => {
    const map = new Map<string, ConflictResolution>();
    for (const c of conflicts) {
      map.set(c.pageName, 'add');
    }
    return map;
  });

  const handleChange = (pageName: string, resolution: ConflictResolution) => {
    setResolutions((prev) => {
      const next = new Map(prev);
      next.set(pageName, resolution);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(resolutions);
  };

  const radioStyle: React.CSSProperties = { cursor: 'pointer' };
  const radioLabelStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 12, cursor: 'pointer', color: tc.textPrimary,
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3>インポート - ページ名の競合</h3>
        <p style={{ fontSize: 13, color: tc.textMuted, margin: '8px 0 12px' }}>
          同名のページが既に存在します。各ページの処理方法を選択してください。
        </p>

        <div style={{
          background: tc.surfaceSecondary, borderRadius: 4, padding: 8,
          maxHeight: 240, overflowY: 'auto',
        }}>
          {conflicts.map((c) => (
            <div key={c.pageName} style={{
              padding: '8px 0', borderBottom: `1px solid ${tc.inputBorder}`,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: tc.textPrimary }}>
                {c.pageName}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {([
                  ['add', '追加（別名）'],
                  ['overwrite', '上書き'],
                  ['skip', 'スキップ'],
                ] as [ConflictResolution, string][]).map(([value, label]) => (
                  <label key={value} style={radioLabelStyle}>
                    <input
                      type="radio"
                      name={`res-${c.pageName}`}
                      value={value}
                      checked={resolutions.get(c.pageName) === value}
                      onChange={() => handleChange(c.pageName, value)}
                      style={radioStyle}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {nonConflicts.length > 0 && (
          <p style={{ fontSize: 12, color: tc.textMuted, marginTop: 8 }}>
            競合なし: {nonConflicts.map((p) => p.name).join(', ')}（そのまま追加）
          </p>
        )}

        <div className="actions">
          <button onClick={onClose}>キャンセル</button>
          <button className="primary" onClick={handleConfirm}>
            インポート実行
          </button>
        </div>
      </div>
    </div>
  );
}
