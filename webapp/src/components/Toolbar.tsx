import { useState, useCallback, useEffect } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useUIStore } from '../hooks/useUIStore';
import { AddItemPanel } from './AddItemPanel';
import { SettingsPopover } from './SettingsPopover';
import { LaneRegistryPanel } from './LaneRegistryPanel';
import { getGanttContainer } from '../lib/gantt-refs';
import { scrollToToday } from '../lib/scroll-utils';
import type { ZoomLevel, DisplayMode } from '../types/schedule';

export function Toolbar() {
  const { data, saveData, undo, redo, canUndo, canRedo, isDirty, isSaving, currentPageId, addLane } = useScheduleStore();
  const { showTooltips, showMemos, toggleTooltips, toggleMemos, placementMode, setPlacementMode, zoomLevel, setZoomLevel, displayMode, setDisplayMode, themeMode, toggleTheme } = useUIStore();
  const [addPanel, setAddPanel] = useState<'bar' | 'milestone' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLaneRegistry, setShowLaneRegistry] = useState(false);

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
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: currentPageId }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule_${currentPageId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
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
        <button onClick={() => handleExport('png')}>PNG</button>
        <button onClick={() => handleExport('pdf')}>PDF</button>
        <span className={`save-status ${isDirty ? 'dirty' : ''}`}>
          {isDirty ? 'Unsaved changes' : 'All saved'}
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
