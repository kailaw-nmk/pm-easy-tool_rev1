import { useCallback, useRef, useState } from 'react';
import type { ScheduleBar, Milestone, SchedulePage, DisplayBox } from '../../types/schedule';
import type { PositionContext } from '../../lib/position';
import { getItemRect } from '../../lib/connection-utils';
import { useScheduleStore } from '../../hooks/useScheduleStore';

interface LaneOffset {
  laneId: string;
  y: number;
}

interface TipMemoItem {
  type: 'tooltip' | 'memo';
  text: string;
  display: DisplayBox;
  itemId: string;
  laneId: string;
  itemKind: 'bar' | 'milestone';
  // Item rect center for arrow
  itemCX: number;
  itemCY: number;
}

interface TipMemoBoxLayerProps {
  page: SchedulePage;
  laneOffsets: LaneOffset[];
  posCtx: PositionContext;
  showTooltips: boolean;
  showMemos: boolean;
  onEditBar?: (barId: string, laneId: string) => void;
  onEditMilestone?: (msId: string, laneId: string) => void;
}

function getDefaultDisplay(
  type: 'tooltip' | 'memo',
  itemRect: { x: number; y: number; w: number; h: number },
  hasOther: boolean,
): DisplayBox {
  if (type === 'tooltip') {
    return {
      dx: itemRect.w + 5,
      dy: -20,
      width: 100,
      height: 30,
      fontSize: 10,
    };
  }
  // memo
  return {
    dx: itemRect.w + 5,
    dy: hasOther ? 15 : itemRect.h + 5,
    width: 120,
    height: 40,
    fontSize: 10,
  };
}

export function TipMemoBoxLayer({
  page,
  laneOffsets,
  posCtx,
  showTooltips,
  showMemos,
  onEditBar,
  onEditMilestone,
}: TipMemoBoxLayerProps) {
  const updateBar = useScheduleStore((s) => s.updateBar);
  const updateMilestone = useScheduleStore((s) => s.updateMilestone);
  const currentPageId = useScheduleStore((s) => s.currentPageId);

  const dragRef = useRef<{
    key: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    origDx: number;
    origDy: number;
    origW: number;
    origH: number;
    origFontSize: number;
    itemId: string;
    laneId: string;
    itemKind: 'bar' | 'milestone';
    boxType: 'tooltip' | 'memo';
  } | null>(null);
  const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number } | null>(null);

  // Collect all tip/memo items
  const items: TipMemoItem[] = [];
  const laneOffsetMap = new Map(laneOffsets.map((lo) => [lo.laneId, lo.y]));

  for (const lane of page.swimLanes) {
    const laneY = laneOffsetMap.get(lane.id);
    if (laneY === undefined) continue;

    for (const bar of lane.bars) {
      const rect = getItemRect(lane, bar.id, laneY, posCtx);
      if (!rect) continue;
      const hasTooltip = showTooltips && !!bar.tooltip;
      const hasMemo = showMemos && !!bar.memo;

      if (hasTooltip) {
        items.push({
          type: 'tooltip',
          text: bar.tooltip!,
          display: bar.tooltipDisplay ?? getDefaultDisplay('tooltip', rect, false),
          itemId: bar.id,
          laneId: lane.id,
          itemKind: 'bar',
          itemCX: rect.x + rect.w / 2,
          itemCY: rect.y + rect.h / 2,
        });
      }
      if (hasMemo) {
        items.push({
          type: 'memo',
          text: bar.memo!,
          display: bar.memoDisplay ?? getDefaultDisplay('memo', rect, hasTooltip),
          itemId: bar.id,
          laneId: lane.id,
          itemKind: 'bar',
          itemCX: rect.x + rect.w / 2,
          itemCY: rect.y + rect.h / 2,
        });
      }
    }

    for (const ms of lane.milestones) {
      const rect = getItemRect(lane, ms.id, laneY, posCtx);
      if (!rect) continue;
      const hasTooltip = showTooltips && !!ms.tooltip;
      const hasMemo = showMemos && !!ms.memo;

      if (hasTooltip) {
        items.push({
          type: 'tooltip',
          text: ms.tooltip!,
          display: ms.tooltipDisplay ?? getDefaultDisplay('tooltip', rect, false),
          itemId: ms.id,
          laneId: lane.id,
          itemKind: 'milestone',
          itemCX: rect.x + rect.w / 2,
          itemCY: rect.y + rect.h / 2,
        });
      }
      if (hasMemo) {
        items.push({
          type: 'memo',
          text: ms.memo!,
          display: ms.memoDisplay ?? getDefaultDisplay('memo', rect, hasTooltip),
          itemId: ms.id,
          laneId: lane.id,
          itemKind: 'milestone',
          itemCX: rect.x + rect.w / 2,
          itemCY: rect.y + rect.h / 2,
        });
      }
    }
  }

  const handlePointerDown = useCallback((
    e: React.PointerEvent,
    item: TipMemoItem,
    mode: 'move' | 'resize',
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const key = `${item.itemId}-${item.type}`;
    dragRef.current = {
      key,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origDx: item.display.dx,
      origDy: item.display.dy,
      origW: item.display.width,
      origH: item.display.height,
      origFontSize: item.display.fontSize,
      itemId: item.itemId,
      laneId: item.laneId,
      itemKind: item.itemKind,
      boxType: item.type,
    };
    setDragDelta({ dx: 0, dy: 0 });

    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const ctm = svg.getScreenCTM();
      const scaleDx = ctm ? dx / ctm.a : dx;
      const scaleDy = ctm ? dy / ctm.d : dy;
      setDragDelta({ dx: scaleDx, dy: scaleDy });
    };

    let lastDelta = { dx: 0, dy: 0 };
    const origOnMove = onMove;
    const trackingMove = (ev: PointerEvent) => {
      origOnMove(ev);
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const ctm = svg.getScreenCTM();
      lastDelta = { dx: ctm ? dx / ctm.a : dx, dy: ctm ? dy / ctm.d : dy };
    };

    const onUp = () => {
      if (dragRef.current) {
        const d = dragRef.current;
        const hasMoved = Math.abs(lastDelta.dx) > 2 || Math.abs(lastDelta.dy) > 2;
        dragRef.current = null;
        setDragDelta(null);

        if (hasMoved) {
          const displayKey = d.boxType === 'tooltip' ? 'tooltipDisplay' : 'memoDisplay';
          if (d.mode === 'move') {
            const newDisplay: DisplayBox = {
              dx: Math.round(d.origDx + lastDelta.dx),
              dy: Math.round(d.origDy + lastDelta.dy),
              width: d.origW,
              height: d.origH,
              fontSize: d.origFontSize,
            };
            if (d.itemKind === 'bar') {
              updateBar(currentPageId, d.laneId, d.itemId, { [displayKey]: newDisplay });
            } else {
              updateMilestone(currentPageId, d.laneId, d.itemId, { [displayKey]: newDisplay });
            }
          } else {
            const newDisplay: DisplayBox = {
              dx: d.origDx,
              dy: d.origDy,
              width: Math.max(40, Math.round(d.origW + lastDelta.dx)),
              height: Math.max(20, Math.round(d.origH + lastDelta.dy)),
              fontSize: d.origFontSize,
            };
            if (d.itemKind === 'bar') {
              updateBar(currentPageId, d.laneId, d.itemId, { [displayKey]: newDisplay });
            } else {
              updateMilestone(currentPageId, d.laneId, d.itemId, { [displayKey]: newDisplay });
            }
          }
        }
      }
      window.removeEventListener('pointermove', trackingMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', trackingMove);
    window.addEventListener('pointerup', onUp);
  }, [currentPageId, updateBar, updateMilestone]);

  const handleDoubleClick = useCallback((e: React.MouseEvent, item: TipMemoItem) => {
    e.stopPropagation();
    if (item.itemKind === 'bar') {
      onEditBar?.(item.itemId, item.laneId);
    } else {
      onEditMilestone?.(item.itemId, item.laneId);
    }
  }, [onEditBar, onEditMilestone]);

  if (items.length === 0) return null;

  return (
    <g className="tip-memo-box-layer">
      <defs>
        <marker
          id="tipmemo-arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#888888" />
        </marker>
      </defs>

      {items.map((item) => {
        const key = `${item.itemId}-${item.type}`;
        const isDragging = dragRef.current?.key === key && dragDelta;

        let renderDx = item.display.dx;
        let renderDy = item.display.dy;
        let renderW = item.display.width;
        let renderH = item.display.height;
        const renderFontSize = item.display.fontSize;

        if (isDragging && dragDelta) {
          if (dragRef.current!.mode === 'move') {
            renderDx = dragRef.current!.origDx + dragDelta.dx;
            renderDy = dragRef.current!.origDy + dragDelta.dy;
          } else {
            renderW = Math.max(40, dragRef.current!.origW + dragDelta.dx);
            renderH = Math.max(20, dragRef.current!.origH + dragDelta.dy);
          }
        }

        // Box position = item rect origin + offset
        const itemRect = getItemRect(
          page.swimLanes.find((l) => l.id === item.laneId)!,
          item.itemId,
          laneOffsetMap.get(item.laneId)!,
          posCtx,
        );
        const boxX = (itemRect ? itemRect.x : item.itemCX) + renderDx;
        const boxY = (itemRect ? itemRect.y : item.itemCY) + renderDy;

        const boxCX = boxX + renderW / 2;
        const boxCY = boxY + renderH / 2;

        const isTooltip = item.type === 'tooltip';
        const fillColor = isTooltip ? '#fffde7cc' : '#e3f2fdcc';
        const borderColor = isTooltip ? '#f9a825' : '#42a5f5';

        return (
          <g key={key}>
            {/* Arrow from box to item */}
            <line
              x1={boxCX}
              y1={boxCY}
              x2={item.itemCX}
              y2={item.itemCY}
              stroke="#888888"
              strokeWidth={1}
              strokeDasharray="3 2"
              markerEnd="url(#tipmemo-arrowhead)"
              pointerEvents="none"
            />

            {/* Box */}
            <rect
              x={boxX}
              y={boxY}
              width={renderW}
              height={renderH}
              fill={fillColor}
              stroke={borderColor}
              strokeWidth={1}
              rx={3}
              ry={3}
              style={{ cursor: 'move' }}
              onPointerDown={(e) => handlePointerDown(e, item, 'move')}
              onDoubleClick={(e) => handleDoubleClick(e, item)}
            />

            {/* Text content */}
            <foreignObject
              x={boxX + 3}
              y={boxY + 2}
              width={renderW - 6}
              height={renderH - 4}
              pointerEvents="none"
              style={{ overflow: 'visible' }}
            >
              <div
                style={{
                  fontSize: renderFontSize,
                  color: '#333',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  userSelect: 'none',
                }}
              >
                {isTooltip ? '' : ''}{item.text}
              </div>
            </foreignObject>

            {/* Type indicator (small label) */}
            <text
              x={boxX + 2}
              y={boxY - 2}
              fontSize={7}
              fill={borderColor}
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              {isTooltip ? 'Tip' : 'Memo'}
            </text>

            {/* Resize handle (bottom-right) */}
            <rect
              x={boxX + renderW - 8}
              y={boxY + renderH - 8}
              width={8}
              height={8}
              fill={borderColor}
              opacity={0.6}
              rx={1}
              style={{ cursor: 'nwse-resize' }}
              onPointerDown={(e) => handlePointerDown(e, item, 'resize')}
            />
          </g>
        );
      })}
    </g>
  );
}
