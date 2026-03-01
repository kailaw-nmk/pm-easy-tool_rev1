import { useState } from 'react';
import type { SchedulePage, PageTimeline, ZoomLevel } from '../../types/schedule';
import { itemX, type PositionContext } from '../../lib/position';
import { useThemeColors } from '../../hooks/useThemeColors';

const DEFAULT_TEXT_WIDTH = 60;

interface Props {
  page: SchedulePage;
  timeline: PageTimeline;
  headerWidth: number;
  zoomLevel: ZoomLevel;
  bodyHeight: number;
  selectedScheduleLineId?: string | null;
  onScheduleLineClick?: (e: React.MouseEvent, lineId: string) => void;
  onScheduleLineContextMenu?: (e: React.MouseEvent, lineId: string) => void;
}

export function ScheduleLineLayer({
  page, timeline, headerWidth, zoomLevel, bodyHeight,
  selectedScheduleLineId, onScheduleLineClick, onScheduleLineContextMenu,
}: Props) {
  const tc = useThemeColors();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scheduleLines = page.scheduleLines ?? [];
  if (scheduleLines.length === 0) return null;

  const posCtx: PositionContext = { timeline, headerWidth, zoomLevel };

  return (
    <g className="schedule-line-layer">
      {scheduleLines.map((sl) => {
        // Find the source milestone
        const lane = page.swimLanes.find((l) => l.id === sl.sourceLaneId);
        const ms = lane?.milestones.find((m) => m.id === sl.sourceItemId);
        if (!ms) return null;

        // Calculate X using same logic as Milestone.tsx
        const dateX = itemX(ms.date, posCtx);
        const defaultStarXOff = (ms.xOffsetPx ?? 0) + (ms.widthPx ?? DEFAULT_TEXT_WIDTH) / 2;
        const starCX = dateX + (ms.starXOffset ?? defaultStarXOff);

        const isSelected = selectedScheduleLineId === sl.id;
        const isHovered = hoveredId === sl.id;
        const color = isSelected ? tc.selectionStroke : sl.color;
        const strokeWidth = isSelected ? sl.strokeWidth + 1.5 : isHovered ? sl.strokeWidth + 0.5 : sl.strokeWidth;

        let dashArray: string | undefined;
        if (sl.lineStyle === 'dashed') dashArray = '8 4';
        else if (sl.lineStyle === 'dotted') dashArray = '3 3';

        return (
          <g key={sl.id}>
            {/* Invisible wide hit area */}
            <line
              x1={starCX} y1={0} x2={starCX} y2={bodyHeight}
              stroke="transparent" strokeWidth={12}
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onScheduleLineClick?.(e, sl.id); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onScheduleLineContextMenu?.(e, sl.id); }}
              onMouseEnter={() => setHoveredId(sl.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
            {/* Visible line */}
            <line
              x1={starCX} y1={0} x2={starCX} y2={bodyHeight}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              pointerEvents="none"
            />
            {/* Label */}
            {sl.label && (
              <text
                x={starCX + 4} y={12}
                fontSize={9}
                fill={isSelected ? tc.selectionStroke : sl.color}
                style={{ userSelect: 'none' }}
                pointerEvents="none"
              >
                {sl.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
