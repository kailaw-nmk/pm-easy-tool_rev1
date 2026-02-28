import { useEffect, useCallback, useRef } from 'react';
import { useScheduleStore } from './hooks/useScheduleStore';
import { useSelectionStore } from './hooks/useSelectionStore';
import { useUIStore } from './hooks/useUIStore';
import { Toolbar } from './components/Toolbar';
import { EmptyState } from './components/EmptyState';
import { PageTabs } from './components/PageTabs';
import { GanttChart } from './components/GanttChart/GanttChart';
import { setGanttContainer, getGanttContainer } from './lib/gantt-refs';
import { scrollToToday } from './lib/scroll-utils';
import { getTheme } from './lib/theme';

export default function App() {
  const { data, loadData, undo, redo, deleteBar, deleteMilestone, currentPageId } = useScheduleStore();
  const { selected, clearSelection } = useSelectionStore();
  const zoomLevel = useUIStore((s) => s.zoomLevel);
  const displayMode = useUIStore((s) => s.displayMode);
  const setContainerWidth = useUIStore((s) => s.setContainerWidth);
  const setContainerHeight = useUIStore((s) => s.setContainerHeight);
  const themeMode = useUIStore((s) => s.themeMode);
  const showHome = useUIStore((s) => s.showHome);
  const setShowHome = useUIStore((s) => s.setShowHome);
  const loadSettings = useUIStore((s) => s.loadSettings);
  const ganttContainerRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Apply theme CSS variables to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeMode);
    const t = getTheme(themeMode);
    root.style.setProperty('--color-bg', t.bg);
    root.style.setProperty('--color-surface', t.surface);
    root.style.setProperty('--color-surface-secondary', t.surfaceSecondary);
    root.style.setProperty('--color-surface-hover', t.surfaceHover);
    root.style.setProperty('--color-border', t.border);
    root.style.setProperty('--color-border-light', t.borderLight);
    root.style.setProperty('--color-text-primary', t.textPrimary);
    root.style.setProperty('--color-text-secondary', t.textSecondary);
    root.style.setProperty('--color-text-muted', t.textMuted);
    root.style.setProperty('--color-accent', t.accent);
    root.style.setProperty('--color-accent-light', t.accentLight);
    root.style.setProperty('--color-accent-hover', t.accentHover);
    root.style.setProperty('--color-danger', t.danger);
    root.style.setProperty('--color-danger-light', t.dangerLight);
    root.style.setProperty('--color-input-border', t.inputBorder);
    root.style.setProperty('--color-input-bg', t.inputBg);
    root.style.setProperty('--color-shadow', t.shadow);
    root.style.setProperty('--color-shadow-strong', t.shadowStrong);
    root.style.setProperty('--color-overlay-bg', t.overlayBg);
    root.style.setProperty('--color-tooltip-bg', t.tooltipBg);
    root.style.setProperty('--color-tooltip-text', t.tooltipText);
    root.style.setProperty('--color-tag-chip-bg', t.tagChipBg);
    root.style.setProperty('--color-tag-chip-text', t.tagChipText);
    root.style.setProperty('--color-tag-chip-remove-hover', t.tagChipRemoveHover);
    root.style.setProperty('--color-toggle-active-bg', t.toggleActiveBg);
    root.style.setProperty('--color-toggle-active-border', t.toggleActiveBorder);
    root.style.setProperty('--color-toggle-active-text', t.toggleActiveText);
    root.style.setProperty('--color-segment-active-bg', t.segmentActiveBg);
    root.style.setProperty('--color-segment-active-text', t.segmentActiveText);
    root.style.setProperty('--color-save-status-dirty', t.saveStatusDirty);
  }, [themeMode]);

  useEffect(() => {
    loadData();
    loadSettings();
  }, [loadData, loadSettings]);

  // Cleanup ResizeObserver on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Scroll to today when zoom level changes
  useEffect(() => {
    const page = data?.pages.find((p) => p.id === currentPageId);
    const timeline = page?.timeline ?? data?.timeline;
    const headerWidth = data?.timeline.laneHeaderWidthPx ?? 140;
    if (!timeline) return;
    const timer = setTimeout(() => {
      const container = getGanttContainer();
      if (container) {
        scrollToToday(container, timeline, headerWidth, zoomLevel);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [zoomLevel, data, currentPageId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
      return;
    }

    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      redo();
    }
    if (e.key === 'Escape') {
      clearSelection();
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selected.length > 0) {
        e.preventDefault();
        for (const item of selected) {
          if (item.type === 'bar') {
            deleteBar(currentPageId, item.laneId, item.id);
          } else {
            deleteMilestone(currentPageId, item.laneId, item.id);
          }
        }
        clearSelection();
      }
    }
  }, [undo, redo, selected, clearSelection, deleteBar, deleteMilestone, currentPageId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!data || showHome) {
    return <EmptyState hasData={!!data} onBack={() => setShowHome(false)} />;
  }

  const setRef = (el: HTMLDivElement | null) => {
    ganttContainerRef.current = el;
    setGanttContainer(el);

    // Setup/teardown ResizeObserver via callback ref
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (el) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
          setContainerHeight(entry.contentRect.height);
        }
      });
      observer.observe(el);
      resizeObserverRef.current = observer;
    }
  };

  return (
    <div className="app-container">
      <Toolbar />
      <PageTabs />
      <div
        className="gantt-container"
        ref={setRef}
        style={displayMode === 'fit' && zoomLevel !== 'day' ? { overflowX: 'hidden', overflowY: 'hidden' } : undefined}
      >
        <GanttChart />
      </div>
    </div>
  );
}
