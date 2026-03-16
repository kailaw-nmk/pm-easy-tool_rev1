import { useState, useCallback, useEffect, useRef } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useUIStore } from '../hooks/useUIStore';
import { AddItemPanel } from './AddItemPanel';
import { SettingsPopover } from './SettingsPopover';
import { LaneRegistryPanel } from './LaneRegistryPanel';
import { ToolbarDropdown } from './ToolbarDropdown';
import { HelpManual } from './HelpManual';
import { FileMemoDialog } from './FileMemoDialog';
import { ExportPageDialog } from './ExportPageDialog';
import { ImportConflictDialog } from './ImportConflictDialog';
import { getGanttContainer } from '../lib/gantt-refs';
import { scrollToToday } from '../lib/scroll-utils';
import { exportToPng, exportToPdf } from '../lib/client-export';
import {
  Home, Save, Undo2, Redo2, Plus, ChevronDown, Link2,
  MousePointerClick, MessageSquare, StickyNote, CalendarCheck,
  Settings, HelpCircle, Moon, Sun, MoreHorizontal,
  RectangleHorizontal, Star, Rows3, LayoutList,
  Upload, Download, Image, FileText, NotebookPen,
} from 'lucide-react';
import type { ZoomLevel, DisplayMode, PartialScheduleExport, ConflictResolution } from '../types/schedule';

export function Toolbar() {
  const { data, saveData, undo, redo, canUndo, canRedo, isDirty, isSaving, currentPageId, addLane, importData, downloadData, importDataAdditive } = useScheduleStore();
  const { showTooltips, showMemos, toggleTooltips, toggleMemos, placementMode, setPlacementMode, zoomLevel, setZoomLevel, displayMode, setDisplayMode, themeMode, toggleTheme, setShowHome } = useUIStore();
  const [addPanel, setAddPanel] = useState<'bar' | 'milestone' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLaneRegistry, setShowLaneRegistry] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showFileMemo, setShowFileMemo] = useState(false);
  const [pendingPartialImport, setPendingPartialImport] = useState<{
    data: PartialScheduleExport;
    conflicts: { pageName: string }[];
    nonConflicts: { name: string }[];
  } | null>(null);
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

        if (parsed.exportType === 'partial') {
          // Partial (additive) import
          if (!Array.isArray(parsed.pages)) {
            alert('無効な部分エクスポートファイルです。');
            return;
          }
          const partialData = parsed as PartialScheduleExport;
          const existingNames = new Set((data?.pages ?? []).map((p) => p.name));
          const conflicts: { pageName: string }[] = [];
          const nonConflicts: { name: string }[] = [];
          for (const page of partialData.pages) {
            if (existingNames.has(page.name)) {
              conflicts.push({ pageName: page.name });
            } else {
              nonConflicts.push({ name: page.name });
            }
          }
          if (conflicts.length > 0) {
            setPendingPartialImport({ data: partialData, conflicts, nonConflicts });
          } else {
            importDataAdditive(partialData, new Map());
          }
        } else {
          // Full import
          if (!parsed.version || !parsed.timeline || !Array.isArray(parsed.pages)) {
            alert('Invalid schedule JSON: missing required fields (version, timeline, pages)');
            return;
          }
          if (!confirm('全データを上書きします。よろしいですか？')) return;
          importData(parsed);
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleConflictResolved = (resolutions: Map<string, ConflictResolution>) => {
    if (pendingPartialImport) {
      importDataAdditive(pendingPartialImport.data, resolutions);
      setPendingPartialImport(null);
    }
  };

  return (
    <>
      <div className="toolbar">
        {/* Home */}
        <button className="icon-btn" onClick={() => setShowHome(true)} title="トップページ">
          <Home size={16} />
        </button>

        <div className="separator" />

        {/* Save */}
        <button className="icon-btn" onClick={() => saveData()} disabled={!isDirty || isSaving} title={isSaving ? 'Saving...' : 'Save'}>
          {isSaving ? '...' : <Save size={16} />}
        </button>

        {/* Undo / Redo */}
        <button className="icon-btn" onClick={undo} disabled={!canUndo()} title="Undo"><Undo2 size={16} /></button>
        <button className="icon-btn" onClick={redo} disabled={!canRedo()} title="Redo"><Redo2 size={16} /></button>

        <div className="separator" />

        {/* Add dropdown: +Bar, +Milestone, +Lane, Lanes */}
        <ToolbarDropdown
          trigger={<><Plus size={16} /> <ChevronDown size={12} /></>}
          items={[
            { label: 'Bar', icon: <RectangleHorizontal size={14} />, onClick: () => setAddPanel('bar') },
            { label: 'Milestone', icon: <Star size={14} />, onClick: () => setAddPanel('milestone') },
            { label: 'Lane', icon: <Rows3 size={14} />, onClick: handleAddLane },
            { label: 'レーン管理', icon: <LayoutList size={14} />, onClick: () => setShowLaneRegistry(true) },
          ]}
        />

        {/* Connect mode toggle */}
        <button
          className={`icon-btn ${placementMode === 'connect' ? 'toggle-active' : ''}`}
          onClick={() => togglePlacementMode('connect')}
          title="接続モード"
        >
          <Link2 size={16} />
        </button>

        {/* Placement dropdown: Bar / Milestone */}
        <ToolbarDropdown
          trigger={<><MousePointerClick size={16} /> <ChevronDown size={12} /></>}
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
          <MessageSquare size={16} /> Tip
        </button>
        <button className={showMemos ? 'toggle-active' : ''} onClick={toggleMemos} title="Memo ON/OFF">
          <StickyNote size={16} /> Memo
        </button>

        {/* File memo */}
        <button className="icon-btn" onClick={() => setShowFileMemo(true)} title="ファイルメモ">
          <NotebookPen size={16} />
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
        <button className="icon-btn" onClick={handleScrollToToday} title="今日の位置にスクロール">
          <CalendarCheck size={16} />
        </button>

        <div className="separator" />

        {/* Settings */}
        <div style={{ position: 'relative' }}>
          <button
            className={`icon-btn ${showSettings ? 'toggle-active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="フォントサイズ設定"
          >
            <Settings size={16} />
          </button>
          {showSettings && <SettingsPopover />}
        </div>

        {/* Help */}
        <button className="icon-btn" onClick={() => setShowHelp(true)} title="使い方マニュアル">
          <HelpCircle size={16} />
        </button>

        {/* Theme toggle */}
        <button
          className="theme-toggle icon-btn"
          onClick={toggleTheme}
          title={themeMode === 'light' ? 'ダークモードに切替' : 'ライトモードに切替'}
        >
          {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <div className="separator" />

        {/* File operations dropdown */}
        <ToolbarDropdown
          trigger={<><MoreHorizontal size={16} /> <ChevronDown size={12} /></>}
          items={[
            { label: 'インポート', icon: <Upload size={14} />, onClick: () => fileInputRef.current?.click() },
            { label: 'エクスポート', icon: <Download size={14} />, onClick: () => setShowExportDialog(true) },
            { label: 'PNG', icon: <Image size={14} />, onClick: () => handleExport('png') },
            { label: 'PDF', icon: <FileText size={14} />, onClick: () => handleExport('pdf') },
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

      {showExportDialog && (
        <ExportPageDialog onClose={() => setShowExportDialog(false)} />
      )}

      {showFileMemo && (
        <FileMemoDialog onClose={() => setShowFileMemo(false)} />
      )}

      {pendingPartialImport && (
        <ImportConflictDialog
          conflicts={pendingPartialImport.conflicts}
          nonConflicts={pendingPartialImport.data.pages.filter(
            (p) => !pendingPartialImport.conflicts.some((c) => c.pageName === p.name)
          )}
          onConfirm={handleConflictResolved}
          onClose={() => setPendingPartialImport(null)}
        />
      )}
    </>
  );
}
