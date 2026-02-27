import type { PageTimeline, DisplayMode, ZoomLevel } from '../types/schedule';
import { monthsBetween } from './date-utils';

interface ResolveParams {
  headerWidth: number;
  containerWidth: number;
  displayMode: DisplayMode;
  zoomLevel: ZoomLevel;
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
  const fitWidth = Math.floor(availableWidth / totalMonths);

  // Clamp to a minimum to keep things readable
  return Math.max(8, fitWidth);
}

/**
 * Returns a copy of the timeline with monthWidthPx overridden
 * by the effective width based on display mode.
 */
export function resolveTimeline(
  timeline: PageTimeline | undefined,
  params: ResolveParams,
): PageTimeline | undefined {
  if (!timeline) return undefined;

  const effectiveWidth = getEffectiveMonthWidth(timeline, params);

  if (effectiveWidth === timeline.monthWidthPx) {
    return timeline; // no change, return same reference
  }

  return {
    ...timeline,
    monthWidthPx: effectiveWidth,
  };
}
