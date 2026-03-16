import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useScheduleStore } from '../../hooks/useScheduleStore';
import { useSelectionStore } from '../../hooks/useSelectionStore';
import { useUIStore } from '../../hooks/useUIStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TimelineHeader } from './TimelineHeader';
import { SwimLaneComponent } from './SwimLane';
import { TodayLine } from './TodayLine';
import { ConnectionLayer } from './ConnectionLayer';
import { SnapPointOverlay } from './SnapPointOverlay';
import { BarEditorDialog } from '../BarEditor';
import { MilestoneEditorDialog } from '../MilestoneEditor';
import { LaneTagEditor } from '../LaneTagEditor';
import { ConnectionEditorDialog } from '../ConnectionEditor';
import { ScheduleLineLayer } from './ScheduleLineLayer';
import { ScheduleLineEditorDialog } from '../ScheduleLineEditor';
import { TextBoxLayer } from './TextBoxLayer';
import { TipMemoBoxLayer } from './TipMemoBoxLayer';
import { TextBoxEditorDialog } from '../TextBoxEditor';
import { monthsBetween, xToMonth } from '../../lib/date-utils';
import { dayZoomTotalWidth, getHeaderHeight } from '../../lib/zoom';
import { resolveTimeline } from '../../lib/effective-timeline';
import { resolveConnections, getItemRect } from '../../lib/connection-utils';
import { generateSnapPoints, findNearestSnapPoint, type SnapPoint } from '../../lib/snap-points';
import type { PositionContext } from '../../lib/position';

interface ContextMenuState {
  x: number;
  y: number;
  type: 'bar' | 'milestone' | 'lane' | 'connection' | 'scheduleLine' | 'textbox';
  id: string;
  laneId: string;
}

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

export function GanttChart() {
  const { data, currentPageId, deleteBar, deleteMilestone, duplicateBar, removeLane, reorderLane, moveLane, updateLaneHeight, addBar, addMilestone, addConnection, deleteConnection, updateConnection, addScheduleLine, deleteScheduleLine, addTextBox, updateTextBox, deleteTextBox } = useScheduleStore();
  const { selected, select, clearSelection } = useSelectionStore();
  const { showTooltips, showMemos, placementMode, setPlacementMode, zoomLevel, displayMode, containerWidth, containerHeight, connectFrom, setConnectFrom, clearConnectFrom } = useUIStore();
  const tc = useThemeColors();
  const [editBar, setEditBar] = useState<{ barId: string; laneId: string } | null>(null);
  const [editMs, setEditMs] = useState<{ msId: string; laneId: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [editLaneTags, setEditLaneTags] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [editConnection, setEditConnection] = useState<string | null>(null);
  const [selectedScheduleLineId, setSelectedScheduleLineId] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ left: number; top: number } | null>(null);
  const [editScheduleLine, setEditScheduleLine] = useState<string | null>(null);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [editTextBox, setEditTextBox] = useState<string | null>(null);
  const [connectHovered, setConnectHovered] = useState<{ itemId: string; laneId: string } | null>(null);
  const [connectMousePos, setConnectMousePos] = useState<{ x: number; y: number } | null>(null);
  const [nearestSnap, setNearestSnap] = useState<SnapPoint | null>(null);
  const bodySvgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    isPanning: boolean;
  } | null>(null);
  const [laneDrag, setLaneDrag] = useState<{
    laneId: string;
    startY: number;
    currentY: number;
    laneHeight: number;
    originalIndex: number;
  } | null>(null);

  const page = data?.pages.find((p) => p.id === currentPageId);
  const rawTimeline = page?.timeline ?? data?.timeline;
  const headerWidth = data?.timeline.laneHeaderWidthPx ?? 140;

  const resolvedTimeline = useMemo(
    () => resolveTimeline(rawTimeline, { headerWidth, containerWidth, displayMode, zoomLevel }),
    [rawTimeline, headerWidth, containerWidth, displayMode, zoomLevel],
  );
  const timeline = resolvedTimeline;
  const fontScale = resolvedTimeline?.fontScale ?? 1.0;

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

  // Effective lane height: in fit mode (non-day zoom), auto-calculate from container height
  const isFitVertical = displayMode === 'fit' && zoomLevel !== 'day';
  const effectiveLaneHeight = useMemo(() => {
    if (!page || !isFitVertical || containerHeight <= 0) return null;
    const numLanes = page.swimLanes.length;
    if (numLanes === 0) return null;
    const availableHeight = containerHeight - headerHeight;
    return Math.max(40, availableHeight / numLanes);
  }, [page, isFitVertical, containerHeight, headerHeight]);

  // Lanes with effective height applied (for rendering only, data unchanged)
  const effectiveLanes = useMemo(() => {
    if (!page) return [];
    if (effectiveLaneHeight === null) return page.swimLanes;
    return page.swimLanes.map((lane) => ({ ...lane, heightPx: effectiveLaneHeight }));
  }, [page, effectiveLaneHeight]);

  // Lane offsets start from 0 (body SVG coordinate space)
  const laneOffsets = useMemo(() => {
    let y = 0;
    return effectiveLanes.map((lane) => {
      const offset = y;
      y += lane.heightPx;
      return { laneId: lane.id, y: offset };
    });
  }, [effectiveLanes]);

  const resolvedConns = useMemo(() => {
    if (!page || !timeline) return [];
    const posCtx: PositionContext = { timeline, headerWidth, zoomLevel };
    // Use a page copy with effective lanes for correct connection positioning
    const effectivePage = effectiveLaneHeight !== null
      ? { ...page, swimLanes: effectiveLanes }
      : page;
    return resolveConnections(effectivePage, laneOffsets, posCtx);
  }, [page, timeline, headerWidth, zoomLevel, laneOffsets, effectiveLanes, effectiveLaneHeight]);

  const bodyHeight = useMemo(() => {
    const lanesTotal = effectiveLanes.reduce((sum, l) => sum + l.heightPx, 0);
    return isFitVertical ? lanesTotal : lanesTotal + 20;
  }, [effectiveLanes, isFitVertical]);

  const selectedIds = useMemo(() => {
    const ids = new Set(selected.map((s) => s.id));
    for (const s of selected) {
      if (s.type === 'lane' && page) {
        const lane = page.swimLanes.find((l) => l.id === s.laneId);
        if (lane) {
          lane.bars.forEach((b) => ids.add(b.id));
          lane.milestones.forEach((m) => ids.add(m.id));
        }
      }
    }
    return ids;
  }, [selected, page]);

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

  const closeContextMenu = useCallback(() => { setContextMenu(null); setContextMenuPos(null); }, []);

  // Adjust context menu position to stay within viewport
  useEffect(() => {
    if (!contextMenu || !contextMenuRef.current) { setContextMenuPos(null); return; }
    const el = contextMenuRef.current;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    let left = contextMenu.x;
    let top = contextMenu.y;
    if (left + rect.width > window.innerWidth - pad) left = window.innerWidth - rect.width - pad;
    if (top + rect.height > window.innerHeight - pad) top = window.innerHeight - rect.height - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    setContextMenuPos({ left, top });
  }, [contextMenu]);

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    if (contextMenu.type === 'bar') {
      deleteBar(currentPageId, contextMenu.laneId, contextMenu.id);
    } else if (contextMenu.type === 'milestone') {
      deleteMilestone(currentPageId, contextMenu.laneId, contextMenu.id);
    } else if (contextMenu.type === 'lane') {
      removeLane(currentPageId, contextMenu.laneId);
    } else if (contextMenu.type === 'connection') {
      deleteConnection(currentPageId, contextMenu.id);
      setSelectedConnectionId(null);
    } else if (contextMenu.type === 'scheduleLine') {
      deleteScheduleLine(currentPageId, contextMenu.id);
      setSelectedScheduleLineId(null);
    } else if (contextMenu.type === 'textbox') {
      deleteTextBox(currentPageId, contextMenu.id);
      setSelectedTextBoxId(null);
    }
    setContextMenu(null);
  }, [contextMenu, currentPageId, deleteBar, deleteMilestone, removeLane, deleteConnection, deleteScheduleLine, deleteTextBox]);

  const handleConnectionClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    clearSelection();
    setSelectedConnectionId(connectionId);
  }, [clearSelection]);

  const handleConnectionDoubleClick = useCallback((connectionId: string) => {
    setEditConnection(connectionId);
  }, []);

  const handleConnectionContextMenu = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedConnectionId(connectionId);
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'connection', id: connectionId, laneId: '' });
  }, []);

  const handleCreateConnection = useCallback(() => {
    if (!contextMenu) return;
    // Need exactly 2 items selected (bar or milestone)
    const items = selected.filter((s) => s.type === 'bar' || s.type === 'milestone');
    if (items.length !== 2) return;
    const [from, to] = items;
    addConnection(currentPageId, {
      id: `conn_${Date.now()}`,
      fromItemId: from.id,
      fromLaneId: from.laneId,
      toItemId: to.id,
      toLaneId: to.laneId,
      lineType: 'orthogonal',
    });
    setContextMenu(null);
  }, [contextMenu, selected, currentPageId, addConnection]);

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
    // Skip click processing after a pan drag
    if (panRef.current?.isPanning) {
      panRef.current = null;
      return;
    }
    panRef.current = null;

    closeContextMenu();

    // Connect mode: handle snap point clicks
    if (placementMode === 'connect' && page && timeline) {
      if (nearestSnap && connectHovered) {
        const anchor = { edge: nearestSnap.edge, position: nearestSnap.position };
        if (!connectFrom) {
          // First click: set start point
          setConnectFrom({ itemId: connectHovered.itemId, laneId: connectHovered.laneId, anchor });
        } else {
          // Second click: create connection (must be different item)
          if (connectFrom.itemId !== connectHovered.itemId) {
            addConnection(currentPageId, {
              id: `conn_${Date.now()}`,
              fromItemId: connectFrom.itemId,
              fromLaneId: connectFrom.laneId,
              toItemId: connectHovered.itemId,
              toLaneId: connectHovered.laneId,
              fromAnchor: connectFrom.anchor,
              toAnchor: anchor,
              lineType: 'orthogonal',
            });
          }
          clearConnectFrom();
          setConnectHovered(null);
          setNearestSnap(null);
          setPlacementMode('none');
        }
        return;
      }
      // Click on empty area while in connect mode — cancel if from is set
      if (connectFrom) {
        clearConnectFrom();
        setConnectHovered(null);
        setNearestSnap(null);
        return;
      }
      return;
    }

    // Placement mode: place item on chart click (body SVG, 0-based Y)
    if (placementMode !== 'none' && page && timeline) {
      const svg = (e.currentTarget as SVGSVGElement);
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

      // TextBox placement (doesn't require a lane target)
      if (placementMode === 'textbox') {
        addTextBox(currentPageId, {
          id: `tb_${Date.now()}`,
          text: 'テキスト',
          x: Math.round(svgPt.x),
          y: Math.round(svgPt.y),
          width: 150,
          height: 60,
          fontSize: 12,
          textColor: '#333333',
          fillColor: '#ffffffcc',
          borderColor: '#888888',
          borderWidth: 1,
        });
        setPlacementMode('none');
        return;
      }

      // Determine which lane was clicked (0-based Y)
      let targetLaneId: string | null = null;
      let laneY = 0;
      for (const lane of effectiveLanes) {
        if (svgPt.y >= laneY && svgPt.y < laneY + lane.heightPx) {
          targetLaneId = lane.id;
          break;
        }
        laneY += lane.heightPx;
      }
      if (!targetLaneId) return;

      const clickDate = xToMonth(svgPt.x, timeline.startDate, timeline.monthWidthPx, headerWidth);

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

    const clickTarget = e.target as SVGElement;
    if (clickTarget.tagName === 'svg' || clickTarget.classList.contains('gantt-bg') || clickTarget.classList.contains('lane-bg')) {
      clearSelection();
      setSelectedConnectionId(null);
      setSelectedScheduleLineId(null);
      setSelectedTextBoxId(null);
    }
  }, [closeContextMenu, clearSelection, placementMode, page, timeline, headerWidth, currentPageId, addBar, addMilestone, addTextBox, setPlacementMode, nearestSnap, connectHovered, connectFrom, setConnectFrom, clearConnectFrom, addConnection, effectiveLanes]);

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
      if (e.key === 'Delete') {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (selectedTextBoxId) {
          deleteTextBox(currentPageId, selectedTextBoxId);
          setSelectedTextBoxId(null);
          return;
        }

        if (selectedScheduleLineId) {
          deleteScheduleLine(currentPageId, selectedScheduleLineId);
          setSelectedScheduleLineId(null);
          return;
        }

        if (selectedConnectionId) {
          deleteConnection(currentPageId, selectedConnectionId);
          setSelectedConnectionId(null);
          return;
        }

        if (selected.length > 0) {
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, selectedConnectionId, selectedScheduleLineId, selectedTextBoxId, currentPageId, deleteBar, deleteMilestone, removeLane, deleteConnection, deleteScheduleLine, deleteTextBox, clearSelection]);

  const handleTooltipShow = useCallback((text: string, x: number, y: number) => {
    if (showTooltips) {
      setTooltip({ text, x, y: y + 8 });
    }
  }, [showTooltips]);

  const handleTooltipHide = useCallback(() => {
    setTooltip(null);
  }, []);

  // Connect mode: track mouse for snap point detection
  const handleConnectMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (placementMode !== 'connect' || !page || !timeline) return;
    const svg = bodySvgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    setConnectMousePos({ x: svgPt.x, y: svgPt.y });

    // Determine which item is hovered
    const posCtx: PositionContext = { timeline, headerWidth, zoomLevel };
    let foundHover: { itemId: string; laneId: string } | null = null;
    let foundSnap: SnapPoint | null = null;

    for (const lane of page.swimLanes) {
      const laneOffset = laneOffsets.find((lo) => lo.laneId === lane.id);
      if (!laneOffset) continue;
      const laneY = laneOffset.y;

      // Check bars
      for (const bar of lane.bars) {
        const rect = getItemRect(lane, bar.id, laneY, posCtx);
        if (!rect) continue;
        // Expand hit area slightly for better hover detection
        if (svgPt.x >= rect.x - 15 && svgPt.x <= rect.x + rect.w + 15 &&
            svgPt.y >= rect.y - 15 && svgPt.y <= rect.y + rect.h + 15) {
          const snaps = generateSnapPoints(rect, 10);
          const nearest = findNearestSnapPoint(svgPt.x, svgPt.y, snaps, 15);
          if (nearest) {
            foundHover = { itemId: bar.id, laneId: lane.id };
            foundSnap = nearest;
            break;
          }
        }
      }
      if (foundHover) break;

      // Check milestones
      for (const ms of lane.milestones) {
        const rect = getItemRect(lane, ms.id, laneY, posCtx);
        if (!rect) continue;
        if (svgPt.x >= rect.x - 15 && svgPt.x <= rect.x + rect.w + 15 &&
            svgPt.y >= rect.y - 15 && svgPt.y <= rect.y + rect.h + 15) {
          const snaps = generateSnapPoints(rect, 10);
          const nearest = findNearestSnapPoint(svgPt.x, svgPt.y, snaps, 15);
          if (nearest) {
            foundHover = { itemId: ms.id, laneId: lane.id };
            foundSnap = nearest;
            break;
          }
        }
      }
      if (foundHover) break;
    }

    setConnectHovered(foundHover);
    setNearestSnap(foundSnap);
  }, [placementMode, page, timeline, headerWidth, zoomLevel, laneOffsets]);

  // Pan handler: start panning on empty area pointerdown
  const handleSvgPointerDown = useCallback((e: React.PointerEvent) => {
    if (placementMode !== 'none' || laneDrag) return;
    const target = e.target as SVGElement;
    if (target.tagName !== 'svg' && !target.classList.contains('gantt-bg') && !target.classList.contains('lane-bg')) return;

    const container = bodySvgRef.current?.closest('.gantt-container') as HTMLElement;
    if (!container) return;

    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      isPanning: false,
    };
  }, [placementMode, laneDrag]);

  // Lane drag handlers
  const handleLaneDragStart = useCallback((laneId: string, startY: number, laneHeight: number) => {
    const idx = effectiveLanes.findIndex((l) => l.id === laneId);
    if (idx < 0 || effectiveLanes.length <= 1) return;
    select({ type: 'lane', id: laneId, laneId });
    setLaneDrag({ laneId, startY, currentY: startY, laneHeight, originalIndex: idx });
  }, [effectiveLanes, select]);

  const handlePointerMoveUnified = useCallback((e: React.PointerEvent) => {
    // Lane drag processing (existing)
    if (laneDrag) {
      setLaneDrag((prev) => prev ? { ...prev, currentY: e.clientY } : null);
      return;
    }

    // Pan processing
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      if (!panRef.current.isPanning && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        panRef.current.isPanning = true;
        const svg = bodySvgRef.current;
        if (svg) svg.style.cursor = 'grabbing';
      }
      if (panRef.current.isPanning) {
        const container = bodySvgRef.current?.closest('.gantt-container') as HTMLElement;
        if (container) {
          container.scrollLeft = panRef.current.scrollLeft - dx;
          container.scrollTop = panRef.current.scrollTop - dy;
        }
      }
    }
  }, [laneDrag]);

  const handlePointerUpUnified = useCallback(() => {
    // Lane drag end (existing)
    if (laneDrag) {
      const dy = laneDrag.currentY - laneDrag.startY;
      let targetIndex = laneDrag.originalIndex;
      let accHeight = 0;
      if (dy > 0) {
        for (let i = laneDrag.originalIndex + 1; i < effectiveLanes.length; i++) {
          accHeight += effectiveLanes[i].heightPx;
          if (dy > accHeight - effectiveLanes[i].heightPx / 2) {
            targetIndex = i;
          } else {
            break;
          }
        }
      } else if (dy < 0) {
        for (let i = laneDrag.originalIndex - 1; i >= 0; i--) {
          accHeight += effectiveLanes[i].heightPx;
          if (-dy > accHeight - effectiveLanes[i].heightPx / 2) {
            targetIndex = i;
          } else {
            break;
          }
        }
      }
      if (targetIndex !== laneDrag.originalIndex) {
        moveLane(currentPageId, laneDrag.laneId, targetIndex);
      }
      setLaneDrag(null);
      return;
    }

    // Pan end
    if (panRef.current) {
      const svg = bodySvgRef.current;
      if (svg) svg.style.cursor = '';
      // Note: panRef is cleared in handleSvgClick if panning occurred,
      // or here if no click event fires
      if (!panRef.current.isPanning) {
        panRef.current = null;
      }
      // If panning, leave panRef for handleSvgClick to detect and clear
    }
  }, [laneDrag, effectiveLanes, currentPageId, moveLane]);

  // ESC key cancels connect mode
  useEffect(() => {
    if (placementMode !== 'connect') return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacementMode('none');
        clearConnectFrom();
        setConnectHovered(null);
        setNearestSnap(null);
        setConnectMousePos(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [placementMode, setPlacementMode, clearConnectFrom]);

  if (!page || !timeline) return <div>No page data</div>;

  return (
    <div style={{ position: 'relative' }}>
      <div className="gantt-inner" style={{ width: totalWidth, minWidth: totalWidth }}>
        {/* Sticky header SVG */}
        <div className="gantt-header-sticky">
          <svg width={totalWidth} height={headerHeight}>
            <rect x={0} y={0} width={totalWidth} height={headerHeight} fill={tc.chartBg} />
            <TimelineHeader timeline={timeline} headerWidth={headerWidth} zoomLevel={zoomLevel} fontScale={fontScale} />
            <TodayLine timeline={timeline} headerWidth={headerWidth} chartHeight={headerHeight} zoomLevel={zoomLevel} region="header" />
          </svg>
        </div>

        {/* Body SVG */}
        <svg
          ref={bodySvgRef}
          className="gantt-chart"
          width={totalWidth}
          height={bodyHeight}
          style={{ minWidth: totalWidth, cursor: laneDrag ? 'grabbing' : placementMode !== 'none' ? 'crosshair' : undefined }}
          onClick={handleSvgClick}
          onMouseMove={handleConnectMouseMove}
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handlePointerMoveUnified}
          onPointerUp={handlePointerUpUnified}
        >
          {/* clipPath for content area (prevents items from bleeding into lane header) */}
          <defs>
            <clipPath id="content-area-clip">
              <rect x={headerWidth} y={0} width={totalWidth - headerWidth} height={bodyHeight} />
            </clipPath>
          </defs>

          {/* Background */}
          <rect className="gantt-bg" x={0} y={0} width={totalWidth} height={bodyHeight} fill={tc.chartBg} />

          {/* Connection arrows (below swim lanes so bars remain clickable) */}
          <g clipPath="url(#content-area-clip)">
            <ConnectionLayer
              resolvedConnections={resolvedConns}
              showMemos={showMemos}
              selectedConnectionId={selectedConnectionId}
              onConnectionClick={handleConnectionClick}
              onConnectionDoubleClick={handleConnectionDoubleClick}
              onConnectionContextMenu={handleConnectionContextMenu}
            />
          </g>

          {/* Schedule lines (vertical lines from milestones) */}
          <g clipPath="url(#content-area-clip)">
            <ScheduleLineLayer
              page={page}
              timeline={timeline}
              headerWidth={headerWidth}
              zoomLevel={zoomLevel}
              bodyHeight={bodyHeight}
              selectedScheduleLineId={selectedScheduleLineId}
              onScheduleLineClick={(e, lineId) => {
                e.stopPropagation();
                clearSelection();
                setSelectedConnectionId(null);
                setSelectedScheduleLineId(lineId);
              }}
              onScheduleLineContextMenu={(e, lineId) => {
                setSelectedScheduleLineId(lineId);
                setContextMenu({ x: e.clientX, y: e.clientY, type: 'scheduleLine', id: lineId, laneId: '' });
              }}
            />
          </g>

          {/* Swim lanes (y starts from 0) */}
          {effectiveLanes.map((lane, i) => {
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
                fontScale={fontScale}
                selectedIds={selectedIds}
                showMemos={showMemos}
                onBarDoubleClick={(barId, laneId) => setEditBar({ barId, laneId })}
                onMilestoneDoubleClick={(msId, laneId) => setEditMs({ msId, laneId })}
                onContextMenu={handleContextMenu}
                onItemClick={handleItemClick}
                onLaneContextMenu={handleLaneContextMenu}
                onLaneClick={handleLaneClick}
                onLaneDragStart={handleLaneDragStart}
                isLaneSelected={selectedIds.has(lane.id)}
                onTooltipShow={handleTooltipShow}
                onTooltipHide={handleTooltipHide}
              />
            );
          })}

          {/* TextBox layer (rendered after swim lanes so boxes are clickable) */}
          {page.textBoxes && page.textBoxes.length > 0 && (
            <g clipPath="url(#content-area-clip)">
              <TextBoxLayer
                textBoxes={page.textBoxes}
                page={page}
                laneOffsets={laneOffsets}
                posCtx={{ timeline, headerWidth, zoomLevel }}
                selectedTextBoxId={selectedTextBoxId}
                onSelect={(id) => {
                  clearSelection();
                  setSelectedConnectionId(null);
                  setSelectedScheduleLineId(null);
                  setSelectedTextBoxId(id);
                }}
                onDoubleClick={(id) => setEditTextBox(id)}
                onContextMenu={(e, id) => {
                  setSelectedTextBoxId(id);
                  setContextMenu({ x: e.clientX, y: e.clientY, type: 'textbox', id, laneId: '' });
                }}
                onUpdate={(id, updates) => updateTextBox(currentPageId, id, updates)}
              />
            </g>
          )}

          {/* TipMemo boxes (rendered after swim lanes so boxes are clickable) */}
          {(showTooltips || showMemos) && (
            <g clipPath="url(#content-area-clip)">
              <TipMemoBoxLayer
                page={{ ...page, swimLanes: effectiveLanes }}
                laneOffsets={laneOffsets}
                posCtx={{ timeline, headerWidth, zoomLevel }}
                showTooltips={showTooltips}
                showMemos={showMemos}
                onEditBar={(barId, laneId) => setEditBar({ barId, laneId })}
                onEditMilestone={(msId, laneId) => setEditMs({ msId, laneId })}
              />
            </g>
          )}

          {/* Snap point overlay for connect mode */}
          {placementMode === 'connect' && (
            <SnapPointOverlay
              page={page}
              laneOffsets={laneOffsets}
              posCtx={{ timeline, headerWidth, zoomLevel }}
              hoveredItem={connectHovered}
              connectFrom={connectFrom}
              mousePos={connectMousePos}
              nearestSnap={nearestSnap}
            />
          )}

          {/* Lane drag ghost and insertion indicator */}
          {laneDrag && (() => {
            const dy = laneDrag.currentY - laneDrag.startY;
            const origOffset = laneOffsets.find((lo) => lo.laneId === laneDrag.laneId);
            if (!origOffset) return null;
            // Calculate insertion indicator Y
            let targetIndex = laneDrag.originalIndex;
            let accHeight = 0;
            if (dy > 0) {
              for (let i = laneDrag.originalIndex + 1; i < effectiveLanes.length; i++) {
                accHeight += effectiveLanes[i].heightPx;
                if (dy > accHeight - effectiveLanes[i].heightPx / 2) targetIndex = i;
                else break;
              }
            } else if (dy < 0) {
              for (let i = laneDrag.originalIndex - 1; i >= 0; i--) {
                accHeight += effectiveLanes[i].heightPx;
                if (-dy > accHeight - effectiveLanes[i].heightPx / 2) targetIndex = i;
                else break;
              }
            }
            let indicatorY = 0;
            for (let i = 0; i <= targetIndex; i++) {
              if (i === targetIndex && targetIndex <= laneDrag.originalIndex) break;
              indicatorY += effectiveLanes[i].heightPx;
            }
            return (
              <>
                {/* Ghost lane */}
                <rect
                  x={0} y={origOffset.y + dy}
                  width={totalWidth} height={laneDrag.laneHeight}
                  fill={tc.accentLight} opacity={0.4}
                  stroke={tc.selectionStroke} strokeWidth={2}
                  pointerEvents="none"
                />
                {/* Insertion indicator */}
                {targetIndex !== laneDrag.originalIndex && (
                  <line
                    x1={0} y1={indicatorY} x2={totalWidth} y2={indicatorY}
                    stroke={tc.accent} strokeWidth={3}
                    strokeDasharray="8 4"
                    pointerEvents="none"
                  />
                )}
              </>
            );
          })()}

          {/* Today line (body only — vertical line) */}
          <g clipPath="url(#content-area-clip)">
            <TodayLine timeline={timeline} headerWidth={headerWidth} chartHeight={bodyHeight} zoomLevel={zoomLevel} region="body" />
          </g>
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
            ref={contextMenuRef}
            className="context-menu"
            style={{
              left: contextMenuPos ? contextMenuPos.left : contextMenu.x,
              top: contextMenuPos ? contextMenuPos.top : contextMenu.y,
              visibility: contextMenuPos ? 'visible' : 'hidden',
            }}
          >
            <div className="context-menu-header">
              <button className="context-menu-close" onClick={closeContextMenu}>✕</button>
            </div>
            {contextMenu.type === 'bar' && (
              <button onClick={handleDuplicate}>Duplicate</button>
            )}
            {(contextMenu.type === 'bar' || contextMenu.type === 'milestone') && (
              <>
                <button onClick={() => {
                  if (contextMenu.type === 'bar') {
                    setEditBar({ barId: contextMenu.id, laneId: contextMenu.laneId });
                  } else {
                    setEditMs({ msId: contextMenu.id, laneId: contextMenu.laneId });
                  }
                  setContextMenu(null);
                }}>Edit</button>
                {selected.filter((s) => s.type === 'bar' || s.type === 'milestone').length === 2 && (
                  <button onClick={handleCreateConnection}>接続を作成</button>
                )}
                {contextMenu.type === 'milestone' && (() => {
                  const existingLine = page?.scheduleLines?.find(
                    (sl) => sl.sourceItemId === contextMenu.id && sl.sourceLaneId === contextMenu.laneId
                  );
                  return existingLine ? (
                    <button onClick={() => {
                      deleteScheduleLine(currentPageId, existingLine.id);
                      setContextMenu(null);
                    }}>スケジュールラインを削除</button>
                  ) : (
                    <button onClick={() => {
                      addScheduleLine(currentPageId, {
                        id: `sl_${Date.now()}`,
                        sourceItemId: contextMenu.id,
                        sourceLaneId: contextMenu.laneId,
                        color: '#3b82f6',
                        strokeWidth: 1.5,
                        lineStyle: 'dashed',
                      });
                      setContextMenu(null);
                    }}>スケジュールラインを描画</button>
                  );
                })()}
              </>
            )}
            {contextMenu.type === 'connection' && (
              <>
                <button onClick={() => { setEditConnection(contextMenu.id); setContextMenu(null); }}>編集...</button>
                <button onClick={() => {
                  const conn = page?.connections?.find((c) => c.id === contextMenu.id);
                  const memo = prompt('メモを入力:', conn?.memo ?? '');
                  if (memo !== null) updateConnection(currentPageId, contextMenu.id, { memo: memo || undefined });
                  setContextMenu(null);
                }}>メモ編集</button>
                <button onClick={() => {
                  const conn = page?.connections?.find((c) => c.id === contextMenu.id);
                  const color = prompt('色を入力 (例: #ff0000):', conn?.color ?? '#888888');
                  if (color !== null) updateConnection(currentPageId, contextMenu.id, { color: color || undefined });
                  setContextMenu(null);
                }}>色変更</button>
              </>
            )}
            {contextMenu.type === 'scheduleLine' && (
              <>
                <button onClick={() => { setEditScheduleLine(contextMenu.id); setContextMenu(null); }}>編集...</button>
              </>
            )}
            {contextMenu.type === 'textbox' && (
              <>
                <button onClick={() => { setEditTextBox(contextMenu.id); setContextMenu(null); }}>編集...</button>
              </>
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
      {editConnection && (
        <ConnectionEditorDialog
          pageId={currentPageId}
          connectionId={editConnection}
          onClose={() => setEditConnection(null)}
        />
      )}
      {editScheduleLine && (
        <ScheduleLineEditorDialog
          pageId={currentPageId}
          lineId={editScheduleLine}
          onClose={() => setEditScheduleLine(null)}
        />
      )}
      {editTextBox && (
        <TextBoxEditorDialog
          pageId={currentPageId}
          textBoxId={editTextBox}
          onClose={() => setEditTextBox(null)}
        />
      )}
    </div>
  );
}
