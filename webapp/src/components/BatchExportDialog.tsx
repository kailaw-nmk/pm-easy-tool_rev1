import { useState, useCallback, useRef } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { exportAllPagesToPng } from '../lib/client-export';

interface Props {
  onClose: () => void;
}

type Phase = 'idle' | 'exporting' | 'done' | 'error';

export function BatchExportDialog({ onClose }: Props) {
  const { data, currentPageId } = useScheduleStore();
  const setCurrentPage = useScheduleStore((s) => s.setCurrentPage);
  const tc = useThemeColors();
  const pages = data?.pages ?? [];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(pages.map((p) => p.id)),
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, pageName: '' });
  const [result, setResult] = useState<{ success: number; skipped: string[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

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

  const handleExport = async () => {
    const selectedPages = pages.filter((p) => selectedIds.has(p.id));
    if (selectedPages.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('exporting');
    setProgress({ current: 0, total: selectedPages.length, pageName: '' });

    try {
      const res = await exportAllPagesToPng({
        pages: selectedPages.map((p) => ({ id: p.id, name: p.name })),
        setCurrentPage,
        currentPageId,
        onProgress: (current, total, pageName) => {
          setProgress({ current, total, pageName });
        },
        signal: controller.signal,
      });
      setResult(res);
      setPhase(res.success > 0 ? 'done' : 'error');
      if (res.success === 0 && !controller.signal.aborted) {
        setErrorMessage('エクスポートに失敗しました。');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setPhase('idle');
      } else {
        setErrorMessage(err?.message ?? 'エクスポート中にエラーが発生しました。');
        setPhase('error');
      }
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setPhase('idle');
  };

  const hasDirectoryPicker = 'showDirectoryPicker' in window;

  return (
    <div className="dialog-overlay" onClick={phase === 'exporting' ? undefined : onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3>一括PNG出力</h3>

        {phase === 'idle' && (
          <>
            {!hasDirectoryPicker && (
              <div style={{
                fontSize: 11, color: tc.textMuted, background: tc.surfaceSecondary,
                padding: '6px 10px', borderRadius: 4, marginTop: 8,
              }}>
                ※ このブラウザではフォルダ選択が使用できないため、個別ダウンロードになります
              </div>
            )}

            <div className="field" style={{ marginTop: 8 }}>
              <label>エクスポートするページを選択</label>
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

            <div style={{ fontSize: 12, color: tc.textSecondary, marginTop: 8 }}>
              memo・tip表示は非表示でエクスポートされます
            </div>

            <div className="actions">
              <button onClick={onClose}>キャンセル</button>
              <button
                className="primary"
                onClick={handleExport}
                disabled={selectedIds.size === 0}
              >
                一括PNG出力
              </button>
            </div>
          </>
        )}

        {phase === 'exporting' && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: tc.textPrimary, marginBottom: 8 }}>
                エクスポート中... {progress.current} / {progress.total}
              </div>
              <div style={{
                width: '100%', height: 8, background: tc.surfaceSecondary,
                borderRadius: 4, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  height: '100%', background: tc.accent,
                  borderRadius: 4, transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: tc.textMuted, marginTop: 4 }}>
                {progress.pageName}
              </div>
            </div>
            <div className="actions">
              <button onClick={handleCancel}>キャンセル</button>
            </div>
          </>
        )}

        {phase === 'done' && result && (
          <>
            <div style={{ marginTop: 16, fontSize: 13, color: tc.textPrimary }}>
              <div>エクスポート完了: {result.success}件のPNGを出力しました。</div>
              {result.skipped.length > 0 && (
                <div style={{ color: tc.textMuted, marginTop: 4, fontSize: 12 }}>
                  スキップ: {result.skipped.join(', ')}
                </div>
              )}
            </div>
            <div className="actions">
              <button className="primary" onClick={onClose}>閉じる</button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <div style={{ marginTop: 16, fontSize: 13, color: tc.textPrimary }}>
              {errorMessage}
            </div>
            <div className="actions">
              <button onClick={onClose}>閉じる</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
