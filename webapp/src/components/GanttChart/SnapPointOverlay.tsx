import { useMemo } from 'react';
import type { SchedulePage, PageTimeline, ZoomLevel, ConnectionAnchor } from '../../types/schedule';
import type { PositionContext } from '../../lib/position';
import { getItemRect } from '../../lib/connection-utils';
import { generateSnapPoints, findNearestSnapPoint, anchorToXY, type SnapPoint, type ItemRect } from '../../lib/snap-points';

interface LaneOffset {
  laneId: string;
  y: number;
}

interface ConnectFrom {
  itemId: string;
  laneId: string;
  anchor: ConnectionAnchor;
}

interface Props {
  page: SchedulePage;
  laneOffsets: LaneOffset[];
  posCtx: PositionContext;
  hoveredItem: { itemId: string; laneId: string } | null;
  connectFrom: ConnectFrom | null;
  mousePos: { x: number; y: number } | null;
  nearestSnap: SnapPoint | null;
}

export function SnapPointOverlay({
  page,
  laneOffsets,
  posCtx,
  hoveredItem,
  connectFrom,
  mousePos,
  nearestSnap,
}: Props) {
  const laneOffsetMap = useMemo(() => new Map(laneOffsets.map((lo) => [lo.laneId, lo.y])), [laneOffsets]);

  // Generate snap points for hovered item
  const hoveredSnapPoints = useMemo(() => {
    if (!hoveredItem) return [];
    const lane = page.swimLanes.find((l) => l.id === hoveredItem.laneId);
    const laneY = laneOffsetMap.get(hoveredItem.laneId);
    if (!lane || laneY === undefined) return [];
    const rect = getItemRect(lane, hoveredItem.itemId, laneY, posCtx);
    if (!rect) return [];
    return generateSnapPoints(rect, 10);
  }, [hoveredItem, page.swimLanes, laneOffsetMap, posCtx]);

  // Compute connectFrom absolute position
  const fromPos = useMemo(() => {
    if (!connectFrom) return null;
    const lane = page.swimLanes.find((l) => l.id === connectFrom.laneId);
    const laneY = laneOffsetMap.get(connectFrom.laneId);
    if (!lane || laneY === undefined) return null;
    const rect = getItemRect(lane, connectFrom.itemId, laneY, posCtx);
    if (!rect) return null;
    return anchorToXY(connectFrom.anchor, rect);
  }, [connectFrom, page.swimLanes, laneOffsetMap, posCtx]);

  return (
    <g className="snap-point-overlay" style={{ pointerEvents: 'none' }}>
      {/* Snap points on hovered item */}
      {hoveredSnapPoints.map((sp, i) => {
        const isNearest = nearestSnap && sp.edge === nearestSnap.edge && sp.position === nearestSnap.position;
        return (
          <circle
            key={i}
            cx={sp.x}
            cy={sp.y}
            r={isNearest ? 5 : 3}
            fill={isNearest ? 'var(--color-accent, #3b82f6)' : 'rgba(59,130,246,0.5)'}
            stroke={isNearest ? '#fff' : 'none'}
            strokeWidth={isNearest ? 1.5 : 0}
          />
        );
      })}

      {/* Confirmed from anchor */}
      {fromPos && (
        <circle
          cx={fromPos.x}
          cy={fromPos.y}
          r={5}
          fill="var(--color-accent, #3b82f6)"
          stroke="#fff"
          strokeWidth={2}
        />
      )}

      {/* Provisional line from start to mouse */}
      {fromPos && mousePos && (
        <line
          x1={fromPos.x}
          y1={fromPos.y}
          x2={nearestSnap ? nearestSnap.x : mousePos.x}
          y2={nearestSnap ? nearestSnap.y : mousePos.y}
          stroke="var(--color-accent, #3b82f6)"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          opacity={0.7}
        />
      )}
    </g>
  );
}
