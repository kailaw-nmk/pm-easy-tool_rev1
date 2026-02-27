import type { ZoomLevel } from '../types/schedule';
import { YEAR_HEADER_Y, YEAR_HEADER_HEIGHT, QUARTER_HEADER_HEIGHT, MONTH_HEADER_HEIGHT } from './constants';

export interface ZoomConfig {
  level: ZoomLevel;
  /** Header layers to show */
  headers: ('year' | 'quarter' | 'month' | 'day')[];
  /** Snap granularity in months (1 for month/quarter/year, 0 means day-level) */
  snapMonths: number;
  /** Whether to use day-based width calculation */
  useDayWidth: boolean;
}

const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  day: {
    level: 'day',
    headers: ['year', 'month', 'day'],
    snapMonths: 0,
    useDayWidth: true,
  },
  month: {
    level: 'month',
    headers: ['year', 'quarter', 'month'],
    snapMonths: 1,
    useDayWidth: false,
  },
  quarter: {
    level: 'quarter',
    headers: ['year', 'quarter'],
    snapMonths: 3,
    useDayWidth: false,
  },
  year: {
    level: 'year',
    headers: ['year'],
    snapMonths: 12,
    useDayWidth: false,
  },
};

export function getZoomConfig(level: ZoomLevel): ZoomConfig {
  return ZOOM_CONFIGS[level];
}

/**
 * Calculate pixel width per day for the Day zoom level.
 * Uses max(20, monthWidthPx / 30) to ensure readability.
 */
export function getDayWidth(monthWidthPx: number): number {
  return Math.max(20, monthWidthPx / 30);
}

/** Calculate header height based on zoom level */
export function getHeaderHeight(level: ZoomLevel): number {
  const config = getZoomConfig(level);
  const headerHeights: Record<string, number> = {
    year: YEAR_HEADER_HEIGHT,
    quarter: QUARTER_HEADER_HEIGHT,
    month: MONTH_HEADER_HEIGHT,
    day: MONTH_HEADER_HEIGHT, // day row uses same height as month
  };
  let height = YEAR_HEADER_Y;
  for (const h of config.headers) {
    height += headerHeights[h] + 2;
  }
  return height;
}

/**
 * Get total width in pixels for a date range at Day zoom level.
 */
export function dayZoomTotalWidth(
  startDate: string,
  endDate: string,
  monthWidthPx: number,
  headerWidth: number,
): number {
  const dayWidth = getDayWidth(monthWidthPx);
  const start = new Date(startDate + '-01');
  const end = new Date(endDate + '-01');
  // Add one month to end to include the last month
  end.setMonth(end.getMonth() + 1);
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return headerWidth + totalDays * dayWidth;
}
