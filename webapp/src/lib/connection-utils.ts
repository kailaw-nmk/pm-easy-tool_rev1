import type { SchedulePage, Connection, ConnectionLineType } from '../types/schedule';
import type { PositionContext } from './position';
import { itemX, itemWidth } from './position';
import { anchorToXY, type ItemRect } from './snap-points';

export interface ResolvedConnection {
  connection: Connection;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  lineType: ConnectionLineType;
}

interface LaneOffset {
  laneId: string;
  y: number;
}

export function resolveConnections(
  page: SchedulePage,
  laneOffsets: LaneOffset[],
  posCtx: PositionContext,
): ResolvedConnection[] {
  const connections = page.connections ?? [];
  if (connections.length === 0) return [];

  const laneOffsetMap = new Map(laneOffsets.map((lo) => [lo.laneId, lo.y]));

  const result: ResolvedConnection[] = [];

  for (const conn of connections) {
    const fromLane = page.swimLanes.find((l) => l.id === conn.fromLaneId);
    const toLane = page.swimLanes.find((l) => l.id === conn.toLaneId);
    if (!fromLane || !toLane) continue;

    const fromLaneY = laneOffsetMap.get(conn.fromLaneId);
    const toLaneY = laneOffsetMap.get(conn.toLaneId);
    if (fromLaneY === undefined || toLaneY === undefined) continue;

    const fromPos = resolveItemPosition(fromLane, conn.fromItemId, fromLaneY, posCtx, 'from', conn.fromAnchor);
    const toPos = resolveItemPosition(toLane, conn.toItemId, toLaneY, posCtx, 'to', conn.toAnchor);
    if (!fromPos || !toPos) continue;

    result.push({
      connection: conn,
      fromX: fromPos.x,
      fromY: fromPos.y,
      toX: toPos.x,
      toY: toPos.y,
      lineType: conn.lineType,
    });
  }

  return result;
}

function resolveItemPosition(
  lane: SchedulePage['swimLanes'][0],
  itemId: string,
  laneY: number,
  posCtx: PositionContext,
  side: 'from' | 'to',
  anchor?: import('../types/schedule').ConnectionAnchor,
): { x: number; y: number } | null {
  // Check bars
  const bar = lane.bars.find((b) => b.id === itemId);
  if (bar) {
    const x = itemX(bar.startMonth, posCtx);
    const w = Math.max(itemWidth(bar.startMonth, bar.endMonth, posCtx), posCtx.timeline.monthWidthPx);
    const y = laneY + bar.yOffsetInLane;
    const h = bar.heightPx;

    if (anchor) {
      const rect: ItemRect = { x, y, w, h };
      return anchorToXY(anchor, rect);
    }

    // Default: from=right-center, to=left-center
    const cy = y + h / 2;
    return side === 'from' ? { x: x + w, y: cy } : { x, y: cy };
  }

  // Check milestones
  const ms = lane.milestones.find((m) => m.id === itemId);
  if (ms) {
    const x = itemX(ms.date, posCtx) + (ms.xOffsetPx ?? 0);
    const w = ms.widthPx ?? 60;
    const y = laneY + ms.yOffsetInLane;
    const h = ms.heightPx ?? 24;

    if (anchor) {
      const rect: ItemRect = { x, y, w, h };
      return anchorToXY(anchor, rect);
    }

    // Default: center
    const cx = x + w / 2;
    const cy = y + h / 2;
    return { x: cx, y: cy };
  }

  return null;
}

/**
 * Compute the bounding rect for an item (bar or milestone) given its lane and position context.
 * Used by SnapPointOverlay to generate snap points.
 */
export function getItemRect(
  lane: SchedulePage['swimLanes'][0],
  itemId: string,
  laneY: number,
  posCtx: PositionContext,
): ItemRect | null {
  const bar = lane.bars.find((b) => b.id === itemId);
  if (bar) {
    const x = itemX(bar.startMonth, posCtx);
    const w = Math.max(itemWidth(bar.startMonth, bar.endMonth, posCtx), posCtx.timeline.monthWidthPx);
    return { x, y: laneY + bar.yOffsetInLane, w, h: bar.heightPx };
  }

  const ms = lane.milestones.find((m) => m.id === itemId);
  if (ms) {
    const x = itemX(ms.date, posCtx) + (ms.xOffsetPx ?? 0);
    return { x, y: laneY + ms.yOffsetInLane, w: ms.widthPx ?? 60, h: ms.heightPx ?? 24 };
  }

  return null;
}
