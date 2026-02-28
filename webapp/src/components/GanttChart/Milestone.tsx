import { useRef, useCallback, useState } from 'react';
import type { Milestone, PageTimeline, ZoomLevel } from '../../types/schedule';
import { itemX, type PositionContext } from '../../lib/position';
import { useScheduleStore } from '../../hooks/useScheduleStore';
import { useUIStore } from '../../hooks/useUIStore';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Props {
  milestone: Milestone;
  laneId: string;
  pageId: string;
  laneY: number;
  timeline: PageTimeline;
  headerWidth: number;
  zoomLevel: ZoomLevel;
  fontScale?: number;
  laneHeight: number;
  isSelected?: boolean;
  showMemos?: boolean;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  onTooltipShow?: (text: string, x: number, y: number) => void;
  onTooltipHide?: () => void;
}

const DRAG_THRESHOLD = 3;
const RESIZE_HANDLE_SIZE = 6;
const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 30;
const MIN_WIDTH = 20;
const MIN_HEIGHT = 16;

export function MilestoneComponent({
  milestone, laneId, pageId, laneY, timeline, headerWidth, zoomLevel, fontScale = 1.0, laneHeight,
  isSelected, showMemos, onDoubleClick, onContextMenu, onClick,
  onTooltipShow, onTooltipHide,
}: Props) {
  const updateMilestone = useScheduleStore((s) => s.updateMilestone);
  const baseFontSizeMilestone = useUIStore((s) => s.fontSizeMilestone);
  const fontSizeMilestone = baseFontSizeMilestone * fontScale;
  const tc = useThemeColors();

  const posCtx: PositionContext = { timeline, headerWidth, zoomLevel };

  // Move drag state
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origYOffset: number;
    hasMoved: boolean;
  } | null>(null);

  // Resize drag state
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const [resizeDelta, setResizeDelta] = useState({ dw: 0, dh: 0 });

  const dateX = itemX(milestone.date, posCtx);
  const baseX = dateX + (milestone.xOffsetPx ?? 0);
  const baseY = laneY + milestone.yOffsetInLane;

  const boxW = (milestone.widthPx ?? DEFAULT_WIDTH) + resizeDelta.dw;
  const boxH = (milestone.heightPx ?? DEFAULT_HEIGHT) + resizeDelta.dh;

  const renderX = baseX + dragOffset.dx;
  const renderY = baseY + dragOffset.dy;

  // Separate ★ marker from label text
  const starMatch = milestone.label.match(/^(★\s*)([\s\S]*)$/);
  const hasStar = !!starMatch;
  const starChar = hasStar ? '★' : '';
  const labelText = hasStar ? starMatch![2].trim() : milestone.label;
  const labelLines = labelText ? labelText.split('\n') : [];

  const starSize = fontSizeMilestone * 1.6;
  const labelLineHeight = fontSizeMilestone + 3;

  // --- Move handlers ---
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origYOffset: milestone.yOffsetInLane,
      hasMoved: false,
    };
  }, [milestone.yOffsetInLane]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!dragRef.current.hasMoved && Math.abs(dx) + Math.abs(dy) >= DRAG_THRESHOLD) {
        dragRef.current.hasMoved = true;
      }
      if (dragRef.current.hasMoved) setDragOffset({ dx, dy });
    }
    if (resizeRef.current) {
      const dw = e.clientX - resizeRef.current.startX;
      const dh = e.clientY - resizeRef.current.startY;
      setResizeDelta({
        dw: Math.max(MIN_WIDTH - resizeRef.current.origW, dw),
        dh: Math.max(MIN_HEIGHT - resizeRef.current.origH, dh),
      });
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Handle resize end
    if (resizeRef.current) {
      const dw = e.clientX - resizeRef.current.startX;
      const dh = e.clientY - resizeRef.current.startY;
      const newW = Math.max(MIN_WIDTH, resizeRef.current.origW + dw);
      const newH = Math.max(MIN_HEIGHT, resizeRef.current.origH + dh);
      updateMilestone(pageId, laneId, milestone.id, {
        widthPx: Math.round(newW),
        heightPx: Math.round(newH),
      });
      setResizeDelta({ dw: 0, dh: 0 });
      resizeRef.current = null;
      return;
    }

    // Handle move end
    const drag = dragRef.current;
    if (!drag) return;

    if (!drag.hasMoved) {
      onClick?.(e as unknown as React.MouseEvent);
      dragRef.current = null;
      return;
    }

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const newAbsX = baseX + dx;
    const newXOffset = newAbsX - dateX;
    const newYOffset = Math.max(0, Math.round(drag.origYOffset + dy));

    updateMilestone(pageId, laneId, milestone.id, {
      xOffsetPx: newXOffset,
      yOffsetInLane: newYOffset,
    });

    setDragOffset({ dx: 0, dy: 0 });
    dragRef.current = null;
  }, [baseX, dateX, laneId, milestone.id, onClick, pageId, updateMilestone]);

  // --- Resize handle ---
  const handleResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: milestone.widthPx ?? DEFAULT_WIDTH,
      origH: milestone.heightPx ?? DEFAULT_HEIGHT,
    };
  }, [milestone.widthPx, milestone.heightPx]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (milestone.tooltip && onTooltipShow) {
      onTooltipShow(milestone.tooltip, e.clientX, e.clientY);
    }
  }, [milestone.tooltip, onTooltipShow]);

  const handleMouseLeave = useCallback(() => {
    onTooltipHide?.();
  }, [onTooltipHide]);

  // Text area: label lines on top, star below
  const labelAreaTop = 4;
  const starY = labelLines.length > 0
    ? labelAreaTop + labelLines.length * labelLineHeight + starSize / 2
    : labelAreaTop + starSize / 2;

  return (
    <g className="milestone"
      onContextMenu={onContextMenu}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={renderX - 1}
          y={renderY - 1}
          width={boxW + 2}
          height={boxH + 2}
          fill="none"
          stroke={tc.selectionStroke}
          strokeWidth={2}
          strokeDasharray="4 2"
          rx={2}
          ry={2}
          pointerEvents="none"
        />
      )}

      {/* Draggable body area */}
      <rect
        x={renderX}
        y={renderY}
        width={boxW}
        height={boxH}
        fill="transparent"
        style={{ cursor: 'move' }}
        onPointerDown={handlePointerDown}
      />

      {/* Label text (no auto-wrap — rendered as entered) */}
      <g pointerEvents="none" clipPath={`url(#ms-clip-${milestone.id})`}>
        <defs>
          <clipPath id={`ms-clip-${milestone.id}`}>
            <rect x={renderX} y={renderY} width={boxW} height={boxH} />
          </clipPath>
        </defs>
        {labelLines.map((line, i) => (
          <text
            key={`label-${i}`}
            x={renderX + boxW / 2}
            y={renderY + labelAreaTop + i * labelLineHeight + fontSizeMilestone / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSizeMilestone}
            fontWeight="bold"
            fill={tc.milestoneText}
            style={{ userSelect: 'none' }}
          >
            {line}
          </text>
        ))}
        {hasStar && (
          <text
            x={renderX + boxW / 2}
            y={renderY + starY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={starSize}
            fill={tc.milestoneText}
            style={{ userSelect: 'none' }}
          >
            {starChar}
          </text>
        )}
      </g>

      {/* Resize handle (bottom-right corner) */}
      <rect
        x={renderX + boxW - RESIZE_HANDLE_SIZE}
        y={renderY + boxH - RESIZE_HANDLE_SIZE}
        width={RESIZE_HANDLE_SIZE}
        height={RESIZE_HANDLE_SIZE}
        fill={isSelected ? tc.selectionStroke : tc.textMuted}
        opacity={isSelected ? 0.7 : 0.3}
        rx={1}
        style={{ cursor: 'nwse-resize' }}
        onPointerDown={handleResizeDown}
      />

      {/* Memo icon */}
      {showMemos && milestone.memo && (
        <text
          x={renderX + boxW - 10}
          y={renderY + 8}
          fontSize={8}
          fill={tc.memoIcon}
          pointerEvents="none"
          style={{ userSelect: 'none' }}
        >
          📝
        </text>
      )}
    </g>
  );
}
