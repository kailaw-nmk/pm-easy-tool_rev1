import { useRef, useCallback, useState } from 'react';
import type { Milestone, PageTimeline, ZoomLevel } from '../../types/schedule';
import { itemX, xToDate, type PositionContext } from '../../lib/position';
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

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origDate: string;
    origYOffset: number;
    hasMoved: boolean;
  } | null>(null);

  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });

  const baseX = itemX(milestone.date, posCtx);
  const baseY = laneY + milestone.yOffsetInLane;

  const renderX = baseX + dragOffset.dx;
  const renderY = baseY + dragOffset.dy;

  // Separate ★ marker from label text: "★ KickOff" → star + "KickOff"
  const starMatch = milestone.label.match(/^(★\s*)([\s\S]*)$/);
  const hasStar = !!starMatch;
  const starChar = hasStar ? '★' : '';
  const labelText = hasStar ? starMatch![2].trim() : milestone.label;
  const labelLines = labelText ? labelText.split('\n') : [];

  const starSize = fontSizeMilestone * 1.6;
  const labelLineHeight = fontSizeMilestone + 3;
  const labelBlockHeight = labelLines.length * labelLineHeight;
  const starBlockHeight = hasStar ? starSize + 2 : 0;
  const textHeight = labelBlockHeight + starBlockHeight + 6;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origDate: milestone.date,
      origYOffset: milestone.yOffsetInLane,
      hasMoved: false,
    };
  }, [milestone.date, milestone.yOffsetInLane]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.hasMoved && Math.abs(dx) + Math.abs(dy) >= DRAG_THRESHOLD) {
      dragRef.current.hasMoved = true;
    }
    if (!dragRef.current.hasMoved) return;

    setDragOffset({ dx, dy });
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

    const newDate = xToDate(baseX + dx, ctx);
    const newYOffset = Math.round(
      Math.max(0, Math.min(laneHeight - textHeight, drag.origYOffset + dy))
    );

    updateMilestone(pageId, laneId, milestone.id, {
      date: newDate,
      yOffsetInLane: newYOffset,
    });

    setDragOffset({ dx: 0, dy: 0 });
    dragRef.current = null;
  }, [baseX, headerWidth, laneHeight, laneId, milestone.id, onClick, pageId, textHeight, timeline, updateMilestone, zoomLevel]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (milestone.tooltip && onTooltipShow) {
      onTooltipShow(milestone.tooltip, e.clientX, e.clientY);
    }
  }, [milestone.tooltip, onTooltipShow]);

  const handleMouseLeave = useCallback(() => {
    onTooltipHide?.();
  }, [onTooltipHide]);

  return (
    <g className="milestone"
      onContextMenu={onContextMenu}
      style={{ cursor: 'move' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={renderX}
          y={renderY}
          width={timeline.monthWidthPx}
          height={textHeight}
          fill="none"
          stroke={tc.selectionStroke}
          strokeWidth={2}
          strokeDasharray="4 2"
          rx={2}
          ry={2}
          pointerEvents="none"
        />
      )}

      {/* Label text above the star */}
      {labelLines.map((line, i) => (
        <text
          key={`label-${i}`}
          x={renderX + timeline.monthWidthPx / 2}
          y={renderY + 8 + i * labelLineHeight}
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
      {/* Star symbol below the label text */}
      {hasStar && (
        <text
          x={renderX + timeline.monthWidthPx / 2}
          y={renderY + labelBlockHeight + 8 + starSize / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={starSize}
          fill={tc.milestoneText}
          style={{ userSelect: 'none' }}
        >
          {starChar}
        </text>
      )}

      {/* Memo icon */}
      {showMemos && milestone.memo && (
        <text
          x={renderX + timeline.monthWidthPx - 10}
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
