import type { ZoomLevel, PageTimeline } from '../types/schedule';
import { monthToX, barWidthPx, xToMonth, dateToXDay, daysBetween2, xToDateDay, snapToQuarter, snapToYear, snapToWeek } from './date-utils';
import { getDayWidth, isDayBased } from './zoom';

export interface PositionContext {
  timeline: PageTimeline;
  headerWidth: number;
  zoomLevel: ZoomLevel;
}

/** Zoom-aware X coordinate for a date (YYYY-MM or YYYY-MM-DD) */
export function itemX(date: string, ctx: PositionContext): number {
  if (isDayBased(ctx.zoomLevel)) {
    const dayWidth = getDayWidth(ctx.timeline.monthWidthPx);
    return dateToXDay(date, ctx.timeline.startDate, dayWidth, ctx.headerWidth);
  }
  // For non-day zoom, use month portion only
  const monthDate = date.substring(0, 7);
  return monthToX(monthDate, ctx.timeline.startDate, ctx.timeline.monthWidthPx, ctx.headerWidth);
}

/** Zoom-aware width between two dates */
export function itemWidth(startMonth: string, endMonth: string, ctx: PositionContext): number {
  if (isDayBased(ctx.zoomLevel)) {
    const dayWidth = getDayWidth(ctx.timeline.monthWidthPx);
    return daysBetween2(startMonth, endMonth) * dayWidth;
  }
  // For non-day zoom, use month portion only
  return barWidthPx(startMonth.substring(0, 7), endMonth.substring(0, 7), ctx.timeline.monthWidthPx);
}

/** Convert X pixel position back to date (zoom-aware with snap) */
export function xToDate(x: number, ctx: PositionContext): string {
  if (isDayBased(ctx.zoomLevel)) {
    const dayWidth = getDayWidth(ctx.timeline.monthWidthPx);
    const dayDate = xToDateDay(x, ctx.timeline.startDate, dayWidth, ctx.headerWidth);
    if (ctx.zoomLevel === 'week') return snapToWeek(dayDate);
    return dayDate;
  }
  const month = xToMonth(x, ctx.timeline.startDate, ctx.timeline.monthWidthPx, ctx.headerWidth);
  if (ctx.zoomLevel === 'quarter') return snapToQuarter(month);
  if (ctx.zoomLevel === 'year') return snapToYear(month);
  return month; // month: as-is
}
