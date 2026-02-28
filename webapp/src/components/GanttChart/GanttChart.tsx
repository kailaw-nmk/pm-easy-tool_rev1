import { useMemo, useState, useCallback, useEffect } from 'react';
import { useScheduleStore } from '../../hooks/useScheduleStore';
import { useSelectionStore } from '../../hooks/useSelectionStore';
import { useUIStore } from '../../hooks/useUIStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TimelineHeader } from './TimelineHeader';
import { SwimLaneComponent } from './SwimLane';
import { TodayLine } from './TodayLine';
import { BarEditorDialog } from '../BarEditor';
import { MilestoneEditorDialog } from '../MilestoneEditor';
import { LaneTagEditor } from '../LaneTagEditor';
import { monthsBetween, xToMonth } from '../../lib/date-utils';
import { dayZoomTotalWidth, getHeaderHeight } from '../../lib/zoom';
import { resolveTimeline } from '../../lib/effective-timeline';

interface ContextMenuState {
  x: number;
  y: number;
  type: 'bar' | 'milestone' | 'lane';
  id: string;
  laneId: string;
}

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

export function GanttChart() {
  const { data, currentPageId, deleteBar, deleteMilestone, duplicateBar, removeLane, reorderLane, updateLaneHeight, addBar, addMilestone } = useScheduleStore();
  const { selected, select, clearSelection } = useSelectionStore();
  const { showTooltips, showMemos, placementMode, setPlacementMode, zoomLevel, displayMode, containerWidth } = useUIStore();
  const tc = useThemeColors();
  const [editBar, setEditBar] = useState<{ barId: string; laneId: string } | null>(null);
  const [editMs, setEditMs] = useState<{ msId: string; laneId: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [editLaneTags, setEditLaneTags] = useState<string | null>(null);

  const page = data?.pages.find((p) => p.id === currentPageId);
  const rawTimeline = page?.timeline ?? data?.timeline;
  const headerWidth = data?.timeline.laneHeaderWidthPx ?? 140;

  const timeline = useMemo(
    () => resolveTimeline(rawTimeline, { headerWidth, containerWidth, displayMode, zoomLevel }),
    [rawTimeline, headerWidth, containerWidth, displayMode, zoomLevel],
  );

  const headerHeight = useMemo(() => getHeaderHeight(zoomLevel), [zoomLevel]);

  const totalMonths = useMemo(() => {
    if (!timeline) return 0;
    return monthsBetween(timeline.startDate, timeline.endDate) + 1;
  }, [timeline]);

  const totalWidth = useMemo(() => {
    if (!timeline) return 800;
    if (zoomLevel === 'day') {
      return dayZoomTotalWidth(timeline.startDate, timeline.endDate, timeline.monthWidthPx, headerWidth);
    }
    return headerWidth + totalMonths * timeline.monthWidthPx;
  }, [timeline, zoomLevel, headerWidth, totalMonths]);

  // Lane offsets start from 0 (body SVG coordinate space)
  const laneOffsets = useMemo(() => {
    if (!page) return [];
    let y = 0;
    return page.swimLanes.map((lane) => {
      const offset = y;
      y += lane.heightPx;
      return { laneId: lane.id, y: offset };
    });
  }, [page]);

  const bodyHeight = useMemo(() => {
    if (!page) return 800;
    return page.swimLanes.reduce((sum, l) => sum + l.heightPx, 0) + 20;
  }, [page]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'bar' | 'milestone', id: string, laneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id, laneId });
  }, []);

  const handleLaneContextMenu = useCallback((e: React.MouseEvent, laneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'lane', id: laneId, laneId });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    if (contextMenu.type === 'bar') {
      deleteBar(currentPageId, contextMenu.laneId, contextMenu.id);
    } else if (contextMenu.type === 'milestone') {
      deleteMilestone(currentPageId, contextMenu.laneId, contextMenu.id);
    } else if (contextMenu.type === 'lane') {
      removeLane(currentPageId, contextMenu.laneId);
    }
    setContextMenu(null);
  }, [contextMenu, currentPageId, deleteBar, deleteMilestone, removeLane]);

  const handleDuplicate = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'bar') return;
    duplicateBar(currentPageId, contextMenu.laneId, contextMenu.id);
    setContextMenu(null);
  }, [contextMenu, currentPageId, duplicateBar]);

  const handleLaneHeightPrompt = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'lane') return;
    const lane = page?.swimLanes.find((l) => l.id === contextMenu.laneId);
    const input = prompt('レーンの高さ (px):', String(lane?.heightPx ?? 80));
    if (input !== null) {
      const val = parseInt(input, 10);
      if (!isNaN(val) && val >= 40) {
        updateLaneHeight(currentPageId, contextMenu.laneId, val);
      }
    }
    setContextMenu(null);
  }, [contextMenu, currentPageId, page, updateLaneHeight]);

  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    closeContextMenu();

    // Placement mode: place item on chart click (body SVG, 0-based Y)
    if (placementMode !== 'none' && page && timeline) {
      const svg = (e.currentTarget as SVGSVGElement);
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

      // Determine which lane was clicked (0-based Y)
      let targetLaneId: string | null = null;
      let laneY = 0;
      for (const lane of page.swimLanes) {
        if (svgPt.y >= laneY && svgPt.y < laneY + lane.heightPx) {
          targetLaneId = lane.id;
          break;
        }
        laneY += lane.heightPx;
      }
      if (!targetLaneId) return;

      const clickDate = xToMonth(svgPt.x, timeline.startDate, timeline.monthWidthPx, headerWidth);
      const yInLane = svgPt.y - laneY + (page.swimLanes.find(l => l.id === targetLaneId)?.heightPx ?? 0);

      if (placementMode === 'bar') {
        const [y, m] = clickDate.split('-').map(Number);
        const total = y * 12 + m - 1 + 3;
        const endDate = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
        addBar(currentPageId, targetLaneId, {
          id: `bar_place_${Date.now()}`,
          label: '新規バー',
          startMonth: clickDate,
          endMonth: endDate,
          color: 'blue',
          yOffsetInLane: Math.max(4, Math.round(svgPt.y - laneY)),
          heightPx: 22,
        });
      } else if (placementMode === 'milestone') {
        addMilestone(currentPageId, targetLaneId, {
          id: `ms_place_${Date.now()}`,
          label: '★ 新規',
          date: clickDate,
          yOffsetInLane: Math.max(4, Math.round(svgPt.y - laneY)),
        });
      }
      setPlacementMode('none');
      return;
    }

    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).classList.contains('gantt-bg')) {
      clearSelection();
    }
  }, [closeContextMenu, clearSelection, placementMode, page, timeline, headerWidth, currentPageId, addBar, addMilestone, setPlacementMode]);

  const handleItemClick = useCallback((e: React.MouseEvent, type: 'bar' | 'milestone', id: string, laneId: string) => {
    e.stopPropagation();
    const multi = e.ctrlKey || e.metaKey;
    select({ type, id, laneId }, multi);
  }, [select]);

  const handleLaneClick = useCallback((e: React.MouseEvent, laneId: string) => {
    e.stopPropagation();
    select({ type: 'lane', id: laneId, laneId });
  }, [select]);

  // Delete key handler for selected items
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selected.length > 0) {
        // Don't delete if an input/textarea is focused
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        for (const item of selected) {
          if (item.type === 'lane') {
            removeLane(currentPageId, item.laneId);
          } else if (item.type === 'bar') {
            deleteBar(currentPageId, item.laneId, item.id);
          } else if (item.type === 'milestone') {
            deleteMilestone(currentPageId, item.laneId, item.id);
          }
        }
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, currentPageId, deleteBar, deleteMilestone, removeLane, clearSelection]);

  const handleTooltipShow = useCallback((text: string, x: number, y: number) => {
    if (showTooltips) {
      setTooltip({ text, x, y: y + 8 });
    }
  }, [showTooltips]);

  const handleTooltipHide = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!page || !timeline) return <div>No page data</div>;

  return (
    <div style={{ position: 'relative' }}>
      <div className="gantt-inner" style={{ width: totalWidth, minWidth: totalWidth }}>
        {/* Sticky header SVG */}
        <div className="gantt-header-sticky">
          <svg width={totalWidth} height={headerHeight}>
            <rect x={0} y={0} width={totalWidth} height={headerHeight} fill={tc.chartBg} />
            <TimelineHeader timeline={timeline} headerWidth={headerWidth} zoomLevel={zoomLevel} />
            <TodayLine timeline={timeline} headerWidth={headerWidth} chartHeight={headerHeight} zoomLevel={zoomLevel} region="header" />
          </svg>
        </div>

        {/* Body SVG */}
        <svg
          className="gantt-chart"
          width={totalWidth}
          height={bodyHeight}
          style={{ minWidth: totalWidth, cursor: placementMode !== 'none' ? 'crosshair' : undefined }}
          onClick={handleSvgClick}
        >
          {/* Background */}
          <rect className="gantt-bg" x={0} y={0} width={totalWidth} height={bodyHeight} fill={tc.chartBg} />

          {/* Swim lanes (y starts from 0) */}
          {page.swimLanes.map((lane, i) => {
            const offset = laneOffsets[i];
            return (
              <SwimLaneComponent
                key={lane.id}
                lane={lane}
                pageId={currentPageId}
                yOffset={offset.y}
                timeline={timeline}
                headerWidth={headerWidth}
                totalWidth={totalWidth}
                zoomLevel={zoomLevel}
                selectedIds={selectedIds}
                showMemos={showMemos}
                onBarDoubleClick={(barId, laneId) => setEditBar({ barId, laneId })}
                onMilestoneDoubleClick={(msId, laneId) => setEditMs({ msId, laneId })}
                onContextMenu={handleContextMenu}
                onItemClick={handleItemClick}
                onLaneContextMenu={handleLaneContextMenu}
                onLaneClick={handleLaneClick}
                isLaneSelected={selectedIds.has(lane.id)}
                onTooltipShow={handleTooltipShow}
                onTooltipHide={handleTooltipHide}
              />
            );
          })}

          {/* Today line (body only — vertical line) */}
          <TodayLine timeline={timeline} headerWidth={headerWidth} chartHeight={bodyHeight} zoomLevel={zoomLevel} region="body" />
        </svg>
      </div>

      {/* Tooltip overlay */}
      {tooltip && (
        <div className="tooltip-popup" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="context-menu-overlay" onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }} />
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="context-menu-header">
              <button className="context-menu-close" onClick={closeContextMenu}>✕</button>
            </div>
            {contextMenu.type === 'bar' && (
              <button onClick={handleDuplicate}>Duplicate</button>
            )}
            {(contextMenu.type === 'bar' || contextMenu.type === 'milestone') && (
              <button onClick={() => {
                if (contextMenu.type === 'bar') {
                  setEditBar({ barId: contextMenu.id, laneId: contextMenu.laneId });
                } else {
                  setEditMs({ msId: contextMenu.id, laneId: contextMenu.laneId });
                }
                setContextMenu(null);
              }}>Edit</button>
            )}
            {contextMenu.type === 'lane' && (
              <>
                <button onClick={handleLaneHeightPrompt}>高さ設定...</button>
                <button onClick={() => { setEditLaneTags(contextMenu.laneId); setContextMenu(null); }}>タグ編集...</button>
                <button onClick={() => { reorderLane(currentPageId, contextMenu.laneId, 'up'); setContextMenu(null); }}>上に移動</button>
                <button onClick={() => { reorderLane(currentPageId, contextMenu.laneId, 'down'); setContextMenu(null); }}>下に移動</button>
              </>
            )}
            <button className="danger" onClick={handleDelete}>Delete</button>
          </div>
        </>
      )}

      {/* Edit dialogs */}
      {editBar && (
        <BarEditorDialog
          pageId={currentPageId}
          laneId={editBar.laneId}
          barId={editBar.barId}
          onClose={() => setEditBar(null)}
        />
      )}
      {editMs && (
        <MilestoneEditorDialog
          pageId={currentPageId}
          laneId={editMs.laneId}
          msId={editMs.msId}
          onClose={() => setEditMs(null)}
        />
      )}
      {editLaneTags && (
        <LaneTagEditor
          pageId={currentPageId}
          laneId={editLaneTags}
          onClose={() => setEditLaneTags(null)}
        />
      )}
    </div>
  );
}
