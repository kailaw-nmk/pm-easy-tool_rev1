import { useRef, useCallback, useState } from 'react';
import type { ScheduleBar, PageTimeline, ZoomLevel } from '../../types/schedule';
import { resolveBarColor } from '../../lib/color-map';
import { monthsBetween, parseYearMonth, formatYearMonth, daysBetween2, parseDate2, formatYearMonthDay } from '../../lib/date-utils';
import { itemX, itemWidth, xToDate, type PositionContext } from '../../lib/position';
import { BAR_BORDER_RADIUS, MIN_BAR_HEIGHT } from '../../lib/constants';
import { useScheduleStore } from '../../hooks/useScheduleStore';
import { useUIStore } from '../../hooks/useUIStore';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Props {
  bar: ScheduleBar;
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

type DragType = 'move' | 'resize-left' | 'resize-right' | 'resize-bottom' | 'resize-corner';

const DRAG_THRESHOLD = 3;
const HANDLE_WIDTH = 6;
const BOTTOM_HANDLE_HEIGHT = 6;

export function ScheduleBarComponent({
  bar, laneId, pageId, laneY, timeline, headerWidth, zoomLevel, fontScale = 1.0, laneHeight,
  isSelected, showMemos, onDoubleClick, onContextMenu, onClick,
  onTooltipShow, onTooltipHide,
}: Props) {
  const updateBar = useScheduleStore((s) => s.updateBar);
  const baseFontSizeBarText = useUIStore((s) => s.fontSizeBarText);
  const fontSizeBarText = baseFontSizeBarText * fontScale;
  const themeMode = useUIStore((s) => s.themeMode);
  const tc = useThemeColors();

  const posCtx: PositionContext = { timeline, headerWidth, zoomLevel };

  const dragRef = useRef<{
    type: DragType;
    startX: number;
    startY: number;
    origStartMonth: string;
    origEndMonth: string;
    origYOffset: number;
    origHeightPx: number;
    hasMoved: boolean;
  } | null>(null);

  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0, dw: 0, dh: 0 });

  const colors = resolveBarColor(bar.color, themeMode);
  const baseX = itemX(bar.startMonth, posCtx);
  const baseWidth = itemWidth(bar.startMonth, bar.endMonth, posCtx);
  const baseY = laneY + bar.yOffsetInLane;
  const effectiveBaseWidth = Math.max(baseWidth, timeline.monthWidthPx);

  // Render coordinates (with drag offset applied)
  const renderX = baseX + dragOffset.dx;
  const renderY = baseY + dragOffset.dy;
  const renderWidth = Math.max(MIN_BAR_HEIGHT, effectiveBaseWidth + dragOffset.dw);
  const renderHeight = Math.max(MIN_BAR_HEIGHT, bar.heightPx + dragOffset.dh);

  const handlePointerDown = useCallback((e: React.PointerEvent, type: DragType) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      origStartMonth: bar.startMonth,
      origEndMonth: bar.endMonth,
      origYOffset: bar.yOffsetInLane,
      origHeightPx: bar.heightPx,
      hasMoved: false,
    };
  }, [bar.startMonth, bar.endMonth, bar.yOffsetInLane, bar.heightPx]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.hasMoved && Math.abs(dx) + Math.abs(dy) >= DRAG_THRESHOLD) {
      dragRef.current.hasMoved = true;
    }
    if (!dragRef.current.hasMoved) return;

    const { type } = dragRef.current;
    switch (type) {
      case 'move':
        setDragOffset({ dx, dy, dw: 0, dh: 0 });
        break;
      case 'resize-left':
        setDragOffset({ dx, dy: 0, dw: -dx, dh: 0 });
        break;
      case 'resize-right':
        setDragOffset({ dx: 0, dy: 0, dw: dx, dh: 0 });
        break;
      case 'resize-bottom':
        setDragOffset({ dx: 0, dy: 0, dw: 0, dh: dy });
        break;
      case 'resize-corner':
        setDragOffset({ dx: 0, dy: 0, dw: dx, dh: dy });
        break;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (!drag.hasMoved) {
      onClick?.(e as unknown as React.MouseEvent);
      dragRef.current = null;
      return;
    }

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const ctx: PositionContext = { timeline, headerWidth, zoomLevel };
    const updates: Partial<ScheduleBar> = {};

    switch (drag.type) {
      case 'move': {
        const newStart = xToDate(baseX + dx, ctx);
        if (zoomLevel === 'day') {
          // Day zoom: preserve duration in days
          const durDays = daysBetween2(drag.origStartMonth, drag.origEndMonth);
          const s = parseDate2(newStart);
          const startD = new Date(s.year, s.month - 1, s.day);
          const endD = new Date(startD.getTime() + durDays * 24 * 60 * 60 * 1000);
          updates.startMonth = newStart;
          updates.endMonth = formatYearMonthDay(endD.getFullYear(), endD.getMonth() + 1, endD.getDate());
        } else {
          // Non-day zoom: preserve duration in months
          const dur = monthsBetween(drag.origStartMonth.substring(0, 7), drag.origEndMonth.substring(0, 7));
          const sp = parseYearMonth(newStart.substring(0, 7));
          const endTotal = sp.year * 12 + sp.month - 1 + dur;
          const newEnd = formatYearMonth(Math.floor(endTotal / 12), (endTotal % 12) + 1);
          updates.startMonth = newStart;
          updates.endMonth = newEnd;
        }
        updates.yOffsetInLane = Math.round(
          Math.max(0, Math.min(laneHeight - drag.origHeightPx, drag.origYOffset + dy))
        );
        break;
      }
      case 'resize-left': {
        const newStart = xToDate(baseX + dx, ctx);
        if (newStart < drag.origEndMonth) {
          updates.startMonth = newStart;
        }
        break;
      }
      case 'resize-right': {
        const newEnd = xToDate(baseX + effectiveBaseWidth + dx, ctx);
        if (newEnd > drag.origStartMonth) {
          updates.endMonth = newEnd;
        }
        break;
      }
      case 'resize-bottom': {
        updates.heightPx = Math.round(
          Math.max(MIN_BAR_HEIGHT, Math.min(laneHeight - drag.origYOffset, drag.origHeightPx + dy))
        );
        break;
      }
      case 'resize-corner': {
        const newEnd = xToDate(baseX + effectiveBaseWidth + dx, ctx);
        if (newEnd > drag.origStartMonth) {
          updates.endMonth = newEnd;
        }
        updates.heightPx = Math.round(
          Math.max(MIN_BAR_HEIGHT, Math.min(laneHeight - drag.origYOffset, drag.origHeightPx + dy))
        );
        break;
      }
    }

    if (Object.keys(updates).length > 0) {
      updateBar(pageId, laneId, bar.id, updates);
    }

    setDragOffset({ dx: 0, dy: 0, dw: 0, dh: 0 });
    dragRef.current = null;
  }, [bar.id, baseX, effectiveBaseWidth, headerWidth, laneHeight, laneId, onClick, pageId, timeline, updateBar, zoomLevel]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (bar.tooltip && onTooltipShow) {
      onTooltipShow(bar.tooltip, e.clientX, e.clientY);
    }
  }, [bar.tooltip, onTooltipShow]);

  const handleMouseLeave = useCallback(() => {
    onTooltipHide?.();
  }, [onTooltipHide]);

  return (
    <g className="schedule-bar" onContextMenu={onContextMenu}>
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={renderX - 2}
          y={renderY - 2}
          width={renderWidth + 4}
          height={renderHeight + 4}
          rx={BAR_BORDER_RADIUS + 1}
          ry={BAR_BORDER_RADIUS + 1}
          fill="none"
          stroke={tc.selectionStroke}
          strokeWidth={2}
          strokeDasharray="4 2"
          pointerEvents="none"
        />
      )}

      {/* Main bar body */}
      <rect
        x={renderX}
        y={renderY}
        width={renderWidth}
        height={renderHeight}
        rx={BAR_BORDER_RADIUS}
        ry={BAR_BORDER_RADIUS}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={1}
        strokeDasharray={bar.style?.dashed ? '5 3' : undefined}
        opacity={bar.style?.opacity ?? 1}
        style={{ cursor: 'move' }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={onDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Label */}
      <text
        x={renderX + renderWidth / 2}
        y={renderY + renderHeight / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSizeBarText}
        fill={colors.fontColor}
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {bar.label.length > Math.floor(renderWidth / 5)
          ? bar.label.substring(0, Math.floor(renderWidth / 5)) + '...'
          : bar.label}
      </text>

      {/* Left resize handle */}
      <rect
        x={renderX}
        y={renderY}
        width={HANDLE_WIDTH}
        height={renderHeight}
        fill="transparent"
        style={{ cursor: 'ew-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-left')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Right resize handle */}
      <rect
        x={renderX + renderWidth - HANDLE_WIDTH}
        y={renderY}
        width={HANDLE_WIDTH}
        height={renderHeight}
        fill="transparent"
        style={{ cursor: 'ew-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-right')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Bottom resize handle */}
      <rect
        x={renderX}
        y={renderY + renderHeight - BOTTOM_HANDLE_HEIGHT}
        width={renderWidth}
        height={BOTTOM_HANDLE_HEIGHT}
        fill="transparent"
        style={{ cursor: 'ns-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-bottom')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Bottom-right corner resize handle */}
      <rect
        x={renderX + renderWidth - HANDLE_WIDTH}
        y={renderY + renderHeight - BOTTOM_HANDLE_HEIGHT}
        width={HANDLE_WIDTH}
        height={BOTTOM_HANDLE_HEIGHT}
        fill="transparent"
        style={{ cursor: 'nwse-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-corner')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </g>
  );
}
