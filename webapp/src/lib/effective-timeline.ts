import type { PageTimeline, DisplayMode, ZoomLevel } from '../types/schedule';
import { monthsBetween } from './date-utils';

const DEFAULT_MONTH_WIDTH = 60;

interface ResolveParams {
  headerWidth: number;
  containerWidth: number;
  displayMode: DisplayMode;
  zoomLevel: ZoomLevel;
}

export interface ResolvedTimeline extends PageTimeline {
  fontScale: number; // 1.0 = normal, >1 = larger, <1 = smaller
}

/**
 * Calculate the effective monthWidthPx based on display mode.
 * - Day zoom: always uses fixed width (original monthWidthPx)
 * - Fixed mode: uses timeline.monthWidthPx as-is
 * - Fit mode: calculates width to fill container without horizontal scroll
 */
export function getEffectiveMonthWidth(
  timeline: PageTimeline,
  params: ResolveParams,
): number {
  // Day zoom → always fixed
  if (params.zoomLevel === 'day') {
    return timeline.monthWidthPx;
  }

  // Fixed mode → original width
  if (params.displayMode === 'fixed') {
    return timeline.monthWidthPx;
  }

  // Fit mode → calculate to fill container
  if (params.containerWidth <= 0) {
    return timeline.monthWidthPx; // fallback before measurement
  }

  const totalMonths = monthsBetween(timeline.startDate, timeline.endDate) + 1;
  if (totalMonths <= 0) return timeline.monthWidthPx;

  const availableWidth = params.containerWidth - params.headerWidth;
  const fitWidth = availableWidth / totalMonths;

  // Clamp to a minimum to keep things readable
  return Math.max(8, fitWidth);
}

/**
 * Returns a ResolvedTimeline with monthWidthPx overridden
 * by the effective width and a computed fontScale.
 */
export function resolveTimeline(
  timeline: PageTimeline | undefined,
  params: ResolveParams,
): ResolvedTimeline | undefined {
  if (!timeline) return undefined;

  const effectiveWidth = getEffectiveMonthWidth(timeline, params);

  // Calculate fontScale
  let fontScale = 1.0;
  if (params.displayMode === 'fit' && params.zoomLevel !== 'day') {
    const raw = effectiveWidth / DEFAULT_MONTH_WIDTH;
    fontScale = Math.max(0.6, Math.min(2.5, raw));
  }

  if (effectiveWidth === timeline.monthWidthPx && fontScale === 1.0) {
    return { ...timeline, fontScale: 1.0 }; // no change
  }

  return {
    ...timeline,
    monthWidthPx: effectiveWidth,
    fontScale,
  };
}
