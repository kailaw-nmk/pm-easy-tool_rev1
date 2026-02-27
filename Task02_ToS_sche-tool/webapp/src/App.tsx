import { useEffect, useCallback, useRef } from 'react';
import { useScheduleStore } from './hooks/useScheduleStore';
import { useSelectionStore } from './hooks/useSelectionStore';
import { useUIStore } from './hooks/useUIStore';
import { Toolbar } from './components/Toolbar';
import { PageTabs } from './components/PageTabs';
import { GanttChart } from './components/GanttChart/GanttChart';
import { setGanttContainer, getGanttContainer } from './lib/gantt-refs';
import { scrollToToday } from './lib/scroll-utils';

export default function App() {
  const { data, loadData, undo, redo, deleteBar, deleteMilestone, currentPageId } = useScheduleStore();
  const { selected, clearSelection } = useSelectionStore();
  const zoomLevel = useUIStore((s) => s.zoomLevel);
  const displayMode = useUIStore((s) => s.displayMode);
  const setContainerWidth = useUIStore((s) => s.setContainerWidth);
  const ganttContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ResizeObserver for container width measurement (fit mode)
  useEffect(() => {
    const el = ganttContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [setContainerWidth]);

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

  if (!data) {
    return <div className="loading">Loading schedule data...</div>;
  }

  const setRef = (el: HTMLDivElement | null) => {
    ganttContainerRef.current = el;
    setGanttContainer(el);
  };

  return (
    <div className="app-container">
      <Toolbar />
      <PageTabs />
      <div
        className="gantt-container"
        ref={setRef}
        style={displayMode === 'fit' && zoomLevel !== 'day' ? { overflowX: 'hidden' } : undefined}
      >
        <GanttChart />
      </div>
    </div>
  );
}
