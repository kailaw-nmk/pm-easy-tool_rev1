import type { ConnectionAnchor } from '../types/schedule';

export interface SnapPoint {
  x: number;
  y: number;
  edge: 'top' | 'right' | 'bottom' | 'left';
  position: number; // 0.0〜1.0
}

export interface ItemRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Generate snap points along the edges of an item rectangle.
 * Each edge is divided into `divisions` segments (producing divisions+1 points).
 */
export function generateSnapPoints(rect: ItemRect, divisions: number = 10): SnapPoint[] {
  const points: SnapPoint[] = [];

  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;

    // Top edge: left to right
    points.push({ x: rect.x + rect.w * t, y: rect.y, edge: 'top', position: t });

    // Bottom edge: left to right
    points.push({ x: rect.x + rect.w * t, y: rect.y + rect.h, edge: 'bottom', position: t });

    // Left edge: top to bottom
    points.push({ x: rect.x, y: rect.y + rect.h * t, edge: 'left', position: t });

    // Right edge: top to bottom
    points.push({ x: rect.x + rect.w, y: rect.y + rect.h * t, edge: 'right', position: t });
  }

  return points;
}

/**
 * Find the nearest snap point to the given mouse coordinates.
 * Returns null if no point is within maxDist.
 */
export function findNearestSnapPoint(
  mouseX: number,
  mouseY: number,
  points: SnapPoint[],
  maxDist: number = 12,
): SnapPoint | null {
  let best: SnapPoint | null = null;
  let bestDist = Infinity;

  for (const p of points) {
    const dx = mouseX - p.x;
    const dy = mouseY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist && dist <= maxDist) {
      bestDist = dist;
      best = p;
    }
  }

  return best;
}

/**
 * Convert a ConnectionAnchor + item rectangle to absolute (x, y) coordinates.
 */
export function anchorToXY(anchor: ConnectionAnchor, rect: ItemRect): { x: number; y: number } {
  switch (anchor.edge) {
    case 'top':
      return { x: rect.x + rect.w * anchor.position, y: rect.y };
    case 'bottom':
      return { x: rect.x + rect.w * anchor.position, y: rect.y + rect.h };
    case 'left':
      return { x: rect.x, y: rect.y + rect.h * anchor.position };
    case 'right':
      return { x: rect.x + rect.w, y: rect.y + rect.h * anchor.position };
  }
}
