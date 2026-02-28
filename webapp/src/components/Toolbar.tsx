import { useState, useCallback, useEffect, useRef } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useUIStore } from '../hooks/useUIStore';
import { AddItemPanel } from './AddItemPanel';
import { SettingsPopover } from './SettingsPopover';
import { LaneRegistryPanel } from './LaneRegistryPanel';
import { ToolbarDropdown } from './ToolbarDropdown';
import { HelpManual } from './HelpManual';
import { getGanttContainer } from '../lib/gantt-refs';
import { scrollToToday } from '../lib/scroll-utils';
import { exportToPng, exportToPdf } from '../lib/client-export';
import type { ZoomLevel, DisplayMode } from '../types/schedule';

export function Toolbar() {
  const { data, saveData, undo, redo, canUndo, canRedo, isDirty, isSaving, currentPageId, addLane, importData, downloadData } = useScheduleStore();
  const { showTooltips, showMemos, toggleTooltips, toggleMemos, placementMode, setPlacementMode, zoomLevel, setZoomLevel, displayMode, setDisplayMode, themeMode, toggleTheme, setShowHome } = useUIStore();
  const [addPanel, setAddPanel] = useState<'bar' | 'milestone' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLaneRegistry, setShowLaneRegistry] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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

  const togglePlacementMode = (mode: 'bar' | 'milestone' | 'connect') => {
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="toolbar">
        {/* Home */}
        <button onClick={() => setShowHome(true)} title="トップページ">
          {'\u{1F3E0}'}
        </button>

        <div className="separator" />

        {/* Save */}
        <button onClick={() => saveData()} disabled={!isDirty || isSaving} title={isSaving ? 'Saving...' : 'Save'}>
          {isSaving ? '...' : '\u{1F4BE}'}
        </button>

        {/* Undo / Redo */}
        <button onClick={undo} disabled={!canUndo()} title="Undo">{'\u21A9'}</button>
        <button onClick={redo} disabled={!canRedo()} title="Redo">{'\u21AA'}</button>

        <div className="separator" />

        {/* Add dropdown: +Bar, +Milestone, +Lane, Lanes */}
        <ToolbarDropdown
          trigger={<>+ {'\u25BC'}</>}
          items={[
            { label: 'Bar', onClick: () => setAddPanel('bar') },
            { label: 'Milestone', onClick: () => setAddPanel('milestone') },
            { label: 'Lane', onClick: handleAddLane },
            { label: '\u30EC\u30FC\u30F3\u7BA1\u7406', onClick: () => setShowLaneRegistry(true) },
          ]}
        />

        {/* Connect mode toggle */}
        <button
          className={placementMode === 'connect' ? 'toggle-active' : ''}
          onClick={() => togglePlacementMode('connect')}
          title="\u63A5\u7D9A\u30E2\u30FC\u30C9"
        >
          {'\u{1F517}'}
        </button>

        {/* Placement dropdown: Bar / Milestone */}
        <ToolbarDropdown
          trigger={<>{'\u914D\u7F6E'} {'\u25BC'}</>}
          items={[
            {
              label: 'Bar',
              onClick: () => togglePlacementMode('bar'),
              active: placementMode === 'bar',
            },
            {
              label: 'Milestone',
              onClick: () => togglePlacementMode('milestone'),
              active: placementMode === 'milestone',
            },
          ]}
        />

        <div className="separator" />

        {/* Tooltip / Memo toggles (compact) */}
        <button className={showTooltips ? 'toggle-active' : ''} onClick={toggleTooltips} title="Tooltip ON/OFF">
          Tip
        </button>
        <button className={showMemos ? 'toggle-active' : ''} onClick={toggleMemos} title="Memo ON/OFF">
          Memo
        </button>

        <div className="separator" />

        {/* Zoom level — segment control */}
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

        {/* Display mode — segment control */}
        <div className="display-mode-group">
          {(['fixed', 'fit'] as DisplayMode[]).map((mode) => (
            <button
              key={mode}
              className={displayMode === mode ? 'mode-active' : ''}
              onClick={() => setDisplayMode(mode)}
              disabled={mode === 'fit' && zoomLevel === 'day'}
              title={mode === 'fixed' ? '\u56FA\u5B9A\u5217\u5E45' : '\u30A6\u30A3\u30F3\u30C9\u30A6\u30D5\u30A3\u30C3\u30C8'}
            >
              {mode === 'fixed' ? 'Fixed' : 'Fit'}
            </button>
          ))}
        </div>

        {/* Today */}
        <button onClick={handleScrollToToday} title="\u4ECA\u65E5\u306E\u4F4D\u7F6E\u306B\u30B9\u30AF\u30ED\u30FC\u30EB">
          {'\u{1F4CD}'}
        </button>

        <div className="separator" />

        {/* Settings */}
        <div style={{ position: 'relative' }}>
          <button
            className={showSettings ? 'toggle-active' : ''}
            onClick={() => setShowSettings(!showSettings)}
            title="\u30D5\u30A9\u30F3\u30C8\u30B5\u30A4\u30BA\u8A2D\u5B9A"
          >
            {'\u2699'}
          </button>
          {showSettings && <SettingsPopover />}
        </div>

        {/* Help */}
        <button onClick={() => setShowHelp(true)} title="使い方マニュアル">
          ?
        </button>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={themeMode === 'light' ? '\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9\u306B\u5207\u66FF' : '\u30E9\u30A4\u30C8\u30E2\u30FC\u30C9\u306B\u5207\u66FF'}
        >
          {themeMode === 'light' ? '\u{1F319}' : '\u2600\uFE0F'}
        </button>

        <div className="separator" />

        {/* File operations dropdown */}
        <ToolbarDropdown
          trigger={<>{'\u22EF'} {'\u25BC'}</>}
          items={[
            { label: 'Import', onClick: () => fileInputRef.current?.click() },
            { label: 'Download', onClick: () => downloadData() },
            { label: 'PNG', onClick: () => handleExport('png') },
            { label: 'PDF', onClick: () => handleExport('pdf') },
          ]}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />

        {/* Save status */}
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

      {showHelp && (
        <HelpManual onClose={() => setShowHelp(false)} />
      )}
    </>
  );
}
