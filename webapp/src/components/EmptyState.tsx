import { useRef } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import type { ScheduleData } from '../types/schedule';

function createDefaultData(): ScheduleData {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return {
    version: '2',
    lastModified: now.toISOString(),
    timeline: {
      startDate: `${y}-01`,
      endDate: `${y + 2}-12`,
      monthWidthPx: 55,
      laneHeaderWidthPx: 140,
    },
    pages: [
      {
        id: 'p0',
        name: 'メイン',
        swimLanes: [
          {
            id: 'lane_1',
            label: 'タスク',
            heightPx: 80,
            bars: [
              {
                id: 'bar_1',
                label: 'サンプルタスク',
                startMonth: `${y}-${m}`,
                endMonth: `${y}-${String(Math.min(12, now.getMonth() + 4)).padStart(2, '0')}`,
                color: 'blue',
                yOffsetInLane: 8,
                heightPx: 24,
              },
            ],
            milestones: [],
          },
        ],
        annotations: [],
      },
    ],
    laneRegistry: [],
  };
}

export function EmptyState() {
  const importData = useScheduleStore((s) => s.importData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.version || !parsed.timeline || !Array.isArray(parsed.pages)) {
          alert('Invalid schedule JSON: missing required fields (version, timeline, pages)');
          return;
        }
        importData(parsed);
      } catch {
        alert('Failed to parse JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleNew = () => {
    importData(createDefaultData());
  };

  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <h2>Schedule Manager</h2>
        <p>ガントチャートのJSONファイルをインポートするか、新規プロジェクトを作成してください。</p>
        <p className="empty-state-hint">データはブラウザのlocalStorageに保存されます。</p>
        <div className="empty-state-actions">
          <button className="primary" onClick={() => fileInputRef.current?.click()}>
            JSONファイルをインポート
          </button>
          <button onClick={handleNew}>
            新規プロジェクトを作成
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>
    </div>
  );
}
