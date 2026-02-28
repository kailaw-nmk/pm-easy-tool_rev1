import { useState, useCallback, useEffect, useRef } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useUIStore } from '../hooks/useUIStore';
import { AddItemPanel } from './AddItemPanel';
import { SettingsPopover } from './SettingsPopover';
import { LaneRegistryPanel } from './LaneRegistryPanel';
import { getGanttContainer } from '../lib/gantt-refs';
import { scrollToToday } from '../lib/scroll-utils';
import { exportToPng, exportToPdf } from '../lib/client-export';
import type { ZoomLevel, DisplayMode } from '../types/schedule';

export function Toolbar() {
  const { data, saveData, undo, redo, canUndo, canRedo, isDirty, isSaving, currentPageId, addLane, importData, downloadData } = useScheduleStore();
  const { showTooltips, showMemos, toggleTooltips, toggleMemos, placementMode, setPlacementMode, zoomLevel, setZoomLevel, displayMode, setDisplayMode, themeMode, toggleTheme } = useUIStore();
  const [addPanel, setAddPanel] = useState<'bar' | 'milestone' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLaneRegistry, setShowLaneRegistry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-switch to Fixed when Day zoom is selected
  useEffect(() => {
    if (zoomLevel === 'day' && displayMode === 'fit') {
      setDisplayMode('fixed');
    }
  }, [zoomLevel, displayMode, setDisplayMode]);

  const handleScrollToToday = useCallback(() => {
    const page = data?.pages.find((p) => p.id === currentPageId);
    const timeline = page?.timeline ?? data?.timeline;
    const headerWidth = data?.timeline.laneHeaderWidthPx ?? 140;
    const container = getGanttContainer();
    if (container && timeline) {
      scrollToToday(container, timeline, headerWidth, zoomLevel);
    }
  }, [data, currentPageId, zoomLevel]);

  const handleExport = async (format: 'png' | 'pdf') => {
    const name = `schedule_${currentPageId}`;
    try {
      if (format === 'png') {
        await exportToPng(`${name}.png`);
      } else {
        await exportToPdf(`${name}.pdf`);
      }
    } catch (err) {
      alert(`Export failed: ${err}`);
    }
  };

  const handleAddLane = () => {
    const newLane = {
      id: `lane_${Date.now()}`,
      label: '新規レーン',
      heightPx: 80,
      bars: [],
      milestones: [],
    };
    addLane(currentPageId, newLane);
  };

  const togglePlacementMode = (mode: 'bar' | 'milestone') => {
    setPlacementMode(placementMode === mode ? 'none' : mode);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Reset so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="toolbar">
        <button onClick={() => saveData()} disabled={!isDirty || isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <div className="separator" />
        <button onClick={undo} disabled={!canUndo()}>Undo</button>
        <button onClick={redo} disabled={!canRedo()}>Redo</button>
        <div className="separator" />
        <div className="editing-group">
          <button onClick={() => setAddPanel('bar')}>+ Bar</button>
          <button onClick={() => setAddPanel('milestone')}>+ Milestone</button>
          <button onClick={handleAddLane}>+ Lane</button>
          <button onClick={() => setShowLaneRegistry(true)}>Lanes</button>
          <div className="separator" />
          <button
            className={placementMode === 'bar' ? 'toggle-active' : ''}
            onClick={() => togglePlacementMode('bar')}
            title="チャート上クリックでバー配置"
          >
            配置: Bar
          </button>
          <button
            className={placementMode === 'milestone' ? 'toggle-active' : ''}
            onClick={() => togglePlacementMode('milestone')}
            title="チャート上クリックでマイルストン配置"
          >
            配置: MS
          </button>
        </div>
        <div className="separator" />
        <button className={showTooltips ? 'toggle-active' : ''} onClick={toggleTooltips}>
          Tooltip {showTooltips ? 'ON' : 'OFF'}
        </button>
        <button className={showMemos ? 'toggle-active' : ''} onClick={toggleMemos}>
          Memo {showMemos ? 'ON' : 'OFF'}
        </button>
        <div className="separator" />
        <div className="zoom-group">
          {(['day', 'month', 'quarter', 'year'] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              className={zoomLevel === level ? 'zoom-active' : ''}
              onClick={() => setZoomLevel(level)}
            >
              {level === 'day' ? 'Day' : level === 'month' ? 'Month' : level === 'quarter' ? 'Q' : 'Year'}
            </button>
          ))}
        </div>
        <div className="display-mode-group">
          {(['fixed', 'fit'] as DisplayMode[]).map((mode) => (
            <button
              key={mode}
              className={displayMode === mode ? 'mode-active' : ''}
              onClick={() => setDisplayMode(mode)}
              disabled={mode === 'fit' && zoomLevel === 'day'}
              title={mode === 'fixed' ? '固定列幅' : 'ウィンドウフィット'}
            >
              {mode === 'fixed' ? 'Fixed' : 'Fit'}
            </button>
          ))}
        </div>
        <button onClick={handleScrollToToday} title="今日の位置にスクロール">
          Today
        </button>
        <div className="separator" />
        <div style={{ position: 'relative' }}>
          <button
            className={showSettings ? 'toggle-active' : ''}
            onClick={() => setShowSettings(!showSettings)}
            title="フォントサイズ設定"
          >
            ⚙
          </button>
          {showSettings && <SettingsPopover />}
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={themeMode === 'light' ? 'ダークモードに切替' : 'ライトモードに切替'}
        >
          {themeMode === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="separator" />
        <button onClick={() => fileInputRef.current?.click()}>Import</button>
        <button onClick={() => downloadData()}>Download</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <button onClick={() => handleExport('png')}>PNG</button>
        <button onClick={() => handleExport('pdf')}>PDF</button>
        <span className={`save-status ${isDirty ? 'dirty' : ''}`}>
          {isDirty ? 'Unsaved changes' : 'Saved to browser'}
        </span>
      </div>

      {addPanel && (
        <AddItemPanel type={addPanel} onClose={() => setAddPanel(null)} />
      )}

      {showLaneRegistry && (
        <LaneRegistryPanel onClose={() => setShowLaneRegistry(false)} />
      )}
    </>
  );
}
