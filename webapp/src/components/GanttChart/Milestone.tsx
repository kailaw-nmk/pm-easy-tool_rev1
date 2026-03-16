import { useRef, useCallback, useState, useMemo } from 'react';
import type { Milestone, PageTimeline, ZoomLevel } from '../../types/schedule';
import { itemX, type PositionContext } from '../../lib/position';
import { useScheduleStore } from '../../hooks/useScheduleStore';
import { useUIStore } from '../../hooks/useUIStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { resolveBarColor } from '../../lib/color-map';
import { measureMilestoneText } from '../../lib/measureText';

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
  // Multi-milestone drag support
  multiDragOffset?: { dx: number; dy: number } | null;
  onMultiDragMove?: (dx: number, dy: number) => void;
  onMultiDragEnd?: (dx: number, dy: number) => void;
  isMultiSelected?: boolean;
}

const DRAG_THRESHOLD = 3;
const RESIZE_HANDLE_SIZE = 6;
const DEFAULT_TEXT_WIDTH = 60;
const DEFAULT_TEXT_HEIGHT = 24;
const MIN_TEXT_WIDTH = 20;
const MIN_TEXT_HEIGHT = 16;
const MIN_STAR_SIZE = 10;

export function MilestoneComponent({
  milestone, laneId, pageId, laneY, timeline, headerWidth, zoomLevel, fontScale = 1.0, laneHeight,
  isSelected, showMemos, onDoubleClick, onContextMenu, onClick,
  onTooltipShow, onTooltipHide,
  multiDragOffset, onMultiDragMove, onMultiDragEnd, isMultiSelected,
}: Props) {
  const updateMilestone = useScheduleStore((s) => s.updateMilestone);
  const baseFontSizeMilestone = useUIStore((s) => s.fontSizeMilestone);
  const fontSizeMilestone = baseFontSizeMilestone * fontScale;
  const themeMode = useUIStore((s) => s.themeMode);
  const tc = useThemeColors();
  const posCtx: PositionContext = { timeline, headerWidth, zoomLevel };

  // Resolve milestone color: custom color or theme default
  const msColor = milestone.color
    ? resolveBarColor(milestone.color, themeMode).fill
    : tc.milestoneText;

  // --- Drag/resize refs ---
  const textDragRef = useRef<{ startX: number; startY: number; origXOff: number; origYOff: number; hasMoved: boolean; axisLock: 'none' | 'h' | 'v' } | null>(null);
  const textResizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const starDragRef = useRef<{ startX: number; startY: number; origXOff: number; origYOff: number; hasMoved: boolean; axisLock: 'none' | 'h' | 'v' } | null>(null);
  const starResizeRef = useRef<{ startX: number; startY: number; origSize: number } | null>(null);

  // --- Visual offsets during drag/resize ---
  const [textDragOffset, setTextDragOffset] = useState({ dx: 0, dy: 0 });
  const [textResizeDelta, setTextResizeDelta] = useState({ dw: 0, dh: 0 });
  const [starDragOffset, setStarDragOffset] = useState({ dx: 0, dy: 0 });
  const [starResizeDelta, setStarResizeDelta] = useState({ ds: 0 });

  // --- Parse label: separate ★ from text ---
  const starMatch = milestone.label.match(/^(★\s*)([\s\S]*)$/);
  const hasStar = !!starMatch;
  const labelText = hasStar ? starMatch![2].trim() : milestone.label;
  const labelLines = labelText ? labelText.split('\n') : [];
  const hasText = labelLines.length > 0;

  // --- Computed positions ---
  // Offset so the star (center of default text width) aligns with month center
  const dateXRaw = itemX(milestone.date, posCtx);
  const monthCenterOffset = zoomLevel === 'day' ? 0 : (timeline.monthWidthPx - DEFAULT_TEXT_WIDTH) / 2;
  const dateX = dateXRaw + monthCenterOffset;
  const labelLineHeight = fontSizeMilestone + 3;

  // Text area — auto-size when widthPx/heightPx not explicitly set
  const autoSize = useMemo(
    () => measureMilestoneText(labelLines, fontSizeMilestone),
    [labelLines, fontSizeMilestone],
  );
  const isAutoWidth = milestone.widthPx == null;
  const isAutoHeight = milestone.heightPx == null;
  const effectiveW = milestone.widthPx ?? Math.max(DEFAULT_TEXT_WIDTH, autoSize.width);
  const effectiveH = milestone.heightPx ?? Math.max(DEFAULT_TEXT_HEIGHT, autoSize.height);

  const textW = Math.max(MIN_TEXT_WIDTH, effectiveW + textResizeDelta.dw);
  const textH = Math.max(MIN_TEXT_HEIGHT, effectiveH + textResizeDelta.dh);

  // Center-based shift: expand from center so star position stays unchanged
  const centerShiftX = isAutoWidth ? -(effectiveW - DEFAULT_TEXT_WIDTH) / 2 : 0;
  const centerShiftY = isAutoHeight ? -(effectiveH - DEFAULT_TEXT_HEIGHT) / 2 : 0;

  // For follower milestones (multi-selected but not the one being dragged), apply parent offset
  const isFollower = multiDragOffset && (textDragOffset.dx === 0 && textDragOffset.dy === 0 && starDragOffset.dx === 0 && starDragOffset.dy === 0);
  const multiDx = isFollower ? multiDragOffset.dx : 0;
  const multiDy = isFollower ? multiDragOffset.dy : 0;

  const textX = dateX + (milestone.xOffsetPx ?? 0) + centerShiftX + textDragOffset.dx + multiDx;
  const textY = laneY + milestone.yOffsetInLane + centerShiftY + textDragOffset.dy + multiDy;

  // Star
  const starSizeBase = milestone.starSize ?? fontSizeMilestone * 1.6;
  const starSizeCurrent = Math.max(MIN_STAR_SIZE, starSizeBase + starResizeDelta.ds);

  // Default star position: centered below text area
  const defaultStarXOff = (milestone.xOffsetPx ?? 0) + (milestone.widthPx ?? DEFAULT_TEXT_WIDTH) / 2;
  const defaultStarYOff = milestone.yOffsetInLane + (milestone.heightPx ?? DEFAULT_TEXT_HEIGHT) + starSizeBase * 0.6 + 2;

  const starCX = dateX + (milestone.starXOffset ?? defaultStarXOff) + starDragOffset.dx + multiDx;
  const starCY = laneY + (milestone.starYOffset ?? defaultStarYOff) + starDragOffset.dy + multiDy;
  const starHitSize = Math.max(starSizeCurrent * 1.1, 20);

  // --- Text drag handlers ---
  const handleTextDragDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    textDragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origXOff: milestone.xOffsetPx ?? 0,
      origYOff: milestone.yOffsetInLane,
      hasMoved: false,
      axisLock: 'none',
    };
  }, [milestone.xOffsetPx, milestone.yOffsetInLane]);

  // --- Text resize handlers ---
  const handleTextResizeDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    textResizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      origW: effectiveW,
      origH: effectiveH,
    };
  }, [effectiveW, effectiveH]);

  // --- Star drag handlers ---
  const handleStarDragDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    starDragRef.current = {
      startX: e.clientX, startY: e.clientY,
      origXOff: milestone.starXOffset ?? defaultStarXOff,
      origYOff: milestone.starYOffset ?? defaultStarYOff,
      hasMoved: false,
      axisLock: 'none',
    };
  }, [milestone.starXOffset, milestone.starYOffset, defaultStarXOff, defaultStarYOff]);

  // --- Star resize handlers ---
  const handleStarResizeDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 2) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    starResizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      origSize: starSizeBase,
    };
  }, [starSizeBase]);

  // --- Common pointer move ---
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (textDragRef.current) {
      let dx = e.clientX - textDragRef.current.startX;
      let dy = e.clientY - textDragRef.current.startY;
      if (!textDragRef.current.hasMoved && Math.abs(dx) + Math.abs(dy) >= DRAG_THRESHOLD) {
        textDragRef.current.hasMoved = true;
      }
      if (textDragRef.current.hasMoved) {
        if (e.shiftKey) {
          if (textDragRef.current.axisLock === 'none') {
            textDragRef.current.axisLock = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
          }
          if (textDragRef.current.axisLock === 'h') dy = 0; else dx = 0;
        } else {
          textDragRef.current.axisLock = 'none';
        }
        setTextDragOffset({ dx, dy });
        if (isMultiSelected && onMultiDragMove) {
          onMultiDragMove(dx, dy);
        }
      }
    }
    if (textResizeRef.current) {
      const dw = e.clientX - textResizeRef.current.startX;
      const dh = e.clientY - textResizeRef.current.startY;
      setTextResizeDelta({
        dw: Math.max(MIN_TEXT_WIDTH - textResizeRef.current.origW, dw),
        dh: Math.max(MIN_TEXT_HEIGHT - textResizeRef.current.origH, dh),
      });
    }
    if (starDragRef.current) {
      let dx = e.clientX - starDragRef.current.startX;
      let dy = e.clientY - starDragRef.current.startY;
      if (!starDragRef.current.hasMoved && Math.abs(dx) + Math.abs(dy) >= DRAG_THRESHOLD) {
        starDragRef.current.hasMoved = true;
      }
      if (starDragRef.current.hasMoved) {
        if (e.shiftKey) {
          if (starDragRef.current.axisLock === 'none') {
            starDragRef.current.axisLock = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
          }
          if (starDragRef.current.axisLock === 'h') dy = 0; else dx = 0;
        } else {
          starDragRef.current.axisLock = 'none';
        }
        setStarDragOffset({ dx, dy });
        if (isMultiSelected && onMultiDragMove) {
          onMultiDragMove(dx, dy);
        }
      }
    }
    if (starResizeRef.current) {
      const dx = e.clientX - starResizeRef.current.startX;
      const dy = e.clientY - starResizeRef.current.startY;
      const ds = (dx + dy) / 2;
      setStarResizeDelta({ ds: Math.max(MIN_STAR_SIZE - starResizeRef.current.origSize, ds) });
    }
  }, [isMultiSelected, onMultiDragMove]);

  // --- Common pointer up ---
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Text resize end
    if (textResizeRef.current) {
      const dw = e.clientX - textResizeRef.current.startX;
      const dh = e.clientY - textResizeRef.current.startY;
      updateMilestone(pageId, laneId, milestone.id, {
        widthPx: Math.round(Math.max(MIN_TEXT_WIDTH, textResizeRef.current.origW + dw)),
        heightPx: Math.round(Math.max(MIN_TEXT_HEIGHT, textResizeRef.current.origH + dh)),
      });
      setTextResizeDelta({ dw: 0, dh: 0 });
      textResizeRef.current = null;
      return;
    }

    // Text drag end
    if (textDragRef.current) {
      if (!textDragRef.current.hasMoved) {
        onClick?.(e as unknown as React.MouseEvent);
        textDragRef.current = null;
        return;
      }
      let dx = e.clientX - textDragRef.current.startX;
      let dy = e.clientY - textDragRef.current.startY;
      if (textDragRef.current.axisLock === 'h') dy = 0;
      else if (textDragRef.current.axisLock === 'v') dx = 0;
      // If multi-selected, delegate to parent for batch update
      if (isMultiSelected && onMultiDragEnd) {
        onMultiDragEnd(dx, dy);
        setTextDragOffset({ dx: 0, dy: 0 });
        textDragRef.current = null;
        return;
      }
      const updates: Partial<Milestone> = {
        xOffsetPx: textDragRef.current.origXOff + dx,
        yOffsetInLane: Math.max(0, Math.round(textDragRef.current.origYOff + dy)),
      };
      // 星の位置が明示設定されている場合、同じ delta を加算して同期
      if (milestone.starXOffset != null) {
        updates.starXOffset = milestone.starXOffset + dx;
      }
      if (milestone.starYOffset != null) {
        updates.starYOffset = milestone.starYOffset + dy;
      }
      updateMilestone(pageId, laneId, milestone.id, updates);
      setTextDragOffset({ dx: 0, dy: 0 });
      textDragRef.current = null;
      return;
    }

    // Star resize end
    if (starResizeRef.current) {
      const dx = e.clientX - starResizeRef.current.startX;
      const dy = e.clientY - starResizeRef.current.startY;
      const ds = (dx + dy) / 2;
      updateMilestone(pageId, laneId, milestone.id, {
        starSize: Math.round(Math.max(MIN_STAR_SIZE, starResizeRef.current.origSize + ds)),
      });
      setStarResizeDelta({ ds: 0 });
      starResizeRef.current = null;
      return;
    }

    // Star drag end
    if (starDragRef.current) {
      if (!starDragRef.current.hasMoved) {
        onClick?.(e as unknown as React.MouseEvent);
        starDragRef.current = null;
        return;
      }
      let dx = e.clientX - starDragRef.current.startX;
      let dy = e.clientY - starDragRef.current.startY;
      if (starDragRef.current.axisLock === 'h') dy = 0;
      else if (starDragRef.current.axisLock === 'v') dx = 0;
      // If multi-selected, delegate to parent for batch update
      if (isMultiSelected && onMultiDragEnd) {
        onMultiDragEnd(dx, dy);
        setStarDragOffset({ dx: 0, dy: 0 });
        starDragRef.current = null;
        return;
      }
      const updates: Partial<Milestone> = {
        starXOffset: starDragRef.current.origXOff + dx,
        starYOffset: starDragRef.current.origYOff + dy,
      };
      // テキスト側の位置も同じ delta を加算して同期
      if (milestone.xOffsetPx != null) {
        updates.xOffsetPx = milestone.xOffsetPx + dx;
      }
      updates.yOffsetInLane = Math.max(0, Math.round(milestone.yOffsetInLane + dy));
      updateMilestone(pageId, laneId, milestone.id, updates);
      setStarDragOffset({ dx: 0, dy: 0 });
      starDragRef.current = null;
      return;
    }
  }, [pageId, laneId, milestone.id, onClick, updateMilestone, isMultiSelected, onMultiDragEnd]);

  // --- Tooltip ---
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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ===== Text area ===== */}
      {hasText && (
        <>
          {/* Text selection highlight */}
          {isSelected && (
            <rect
              x={textX - 1} y={textY - 1}
              width={textW + 2} height={textH + 2}
              fill="none" stroke={tc.selectionStroke}
              strokeWidth={2} strokeDasharray="4 2"
              rx={2} ry={2} pointerEvents="none"
            />
          )}

          {/* Draggable text body */}
          <rect
            x={textX} y={textY}
            width={textW} height={textH}
            fill="transparent"
            style={{ cursor: 'move' }}
            onPointerDown={handleTextDragDown}
          />

          {/* Label text with clipPath */}
          <g pointerEvents="none" clipPath={`url(#ms-text-clip-${milestone.id})`}>
            <defs>
              <clipPath id={`ms-text-clip-${milestone.id}`}>
                <rect x={textX} y={textY} width={textW} height={textH} />
              </clipPath>
            </defs>
            {labelLines.map((line, i) => (
              <text
                key={`label-${i}`}
                x={textX + textW / 2}
                y={textY + 4 + i * labelLineHeight + fontSizeMilestone / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSizeMilestone}
                fontWeight="bold"
                fill={msColor}
                style={{ userSelect: 'none' }}
              >
                {line}
              </text>
            ))}
          </g>

          {/* Text resize handle (bottom-right) */}
          <rect
            x={textX + textW - RESIZE_HANDLE_SIZE}
            y={textY + textH - RESIZE_HANDLE_SIZE}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill={isSelected ? tc.selectionStroke : tc.textMuted}
            opacity={isSelected ? 0.7 : 0.3}
            rx={1}
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={handleTextResizeDown}
          />
        </>
      )}

      {/* ===== Star icon ===== */}
      {hasStar && (
        <>
          {/* Star selection highlight */}
          {isSelected && (
            <rect
              x={starCX - starHitSize / 2 - 1}
              y={starCY - starHitSize / 2 - 1}
              width={starHitSize + 2} height={starHitSize + 2}
              fill="none" stroke={tc.selectionStroke}
              strokeWidth={2} strokeDasharray="4 2"
              rx={2} ry={2} pointerEvents="none"
            />
          )}

          {/* Draggable star body */}
          <rect
            x={starCX - starHitSize / 2}
            y={starCY - starHitSize / 2}
            width={starHitSize} height={starHitSize}
            fill="transparent"
            style={{ cursor: 'move' }}
            onPointerDown={handleStarDragDown}
          />

          {/* Star character */}
          <text
            x={starCX} y={starCY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={starSizeCurrent}
            fill={msColor}
            pointerEvents="none"
            style={{ userSelect: 'none' }}
          >★</text>

          {/* Star resize handle (bottom-right of hit area) */}
          <rect
            x={starCX + starHitSize / 2 - RESIZE_HANDLE_SIZE}
            y={starCY + starHitSize / 2 - RESIZE_HANDLE_SIZE}
            width={RESIZE_HANDLE_SIZE}
            height={RESIZE_HANDLE_SIZE}
            fill={isSelected ? tc.selectionStroke : tc.textMuted}
            opacity={isSelected ? 0.7 : 0.3}
            rx={1}
            style={{ cursor: 'nwse-resize' }}
            onPointerDown={handleStarResizeDown}
          />
        </>
      )}

    </g>
  );
}
