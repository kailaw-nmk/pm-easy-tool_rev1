import { LANE_HEADER_WIDTH, DEFAULT_MONTH_WIDTH } from './constants';

/** Parse "YYYY-MM" to { year, month } */
export function parseYearMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number);
  return { year: y, month: m };
}

/** Parse "YYYY-MM" or "YYYY-MM-DD" to { year, month, day } (day defaults to 1) */
export function parseDate2(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  return { year: parts[0], month: parts[1], day: parts[2] ?? 1 };
}

/** Format to "YYYY-MM-DD" */
export function formatYearMonthDay(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Get today as "YYYY-MM-DD" */
export function todayYearMonthDay(): string {
  const now = new Date();
  return formatYearMonthDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Days between two dates supporting both "YYYY-MM" and "YYYY-MM-DD" formats */
export function daysBetween2(start: string, end: string): number {
  const s = parseDate2(start);
  const e = parseDate2(end);
  const sd = new Date(s.year, s.month - 1, s.day);
  const ed = new Date(e.year, e.month - 1, e.day);
  return Math.round((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24));
}

/** Snap "YYYY-MM" to nearest quarter boundary (month 1/4/7/10) */
export function snapToQuarter(ym: string): string {
  const { year, month } = parseYearMonth(ym.substring(0, 7));
  const quarterStarts = [1, 4, 7, 10];
  let closest = quarterStarts[0];
  let minDist = Math.abs(month - closest);
  for (const q of quarterStarts) {
    const dist = Math.abs(month - q);
    if (dist < minDist) { minDist = dist; closest = q; }
  }
  // Handle wrap: if month=12 is closest to 1 of next year
  if (month >= 11 && Math.abs(month - 13) < minDist) {
    return formatYearMonth(year + 1, 1);
  }
  return formatYearMonth(year, closest);
}

/** Snap "YYYY-MM" to nearest year boundary (month 1) */
export function snapToYear(ym: string): string {
  const { year, month } = parseYearMonth(ym.substring(0, 7));
  if (month >= 7) return formatYearMonth(year + 1, 1);
  return formatYearMonth(year, 1);
}

/** Format { year, month } to "YYYY-MM" */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Calculate the number of months between two "YYYY-MM" strings */
export function monthsBetween(start: string, end: string): number {
  const s = parseYearMonth(start);
  const e = parseYearMonth(end);
  return (e.year - s.year) * 12 + (e.month - s.month);
}

/** Convert a "YYYY-MM" date to X pixel position */
export function monthToX(
  date: string,
  timelineStart: string,
  monthWidth: number = DEFAULT_MONTH_WIDTH,
  headerWidth: number = LANE_HEADER_WIDTH
): number {
  const offset = monthsBetween(timelineStart, date);
  return headerWidth + offset * monthWidth;
}

/** Convert X pixel position to "YYYY-MM" date (snapped to month) */
export function xToMonth(
  x: number,
  timelineStart: string,
  monthWidth: number = DEFAULT_MONTH_WIDTH,
  headerWidth: number = LANE_HEADER_WIDTH
): string {
  const offsetMonths = Math.round((x - headerWidth) / monthWidth);
  const start = parseYearMonth(timelineStart);
  let totalMonths = (start.year * 12 + start.month - 1) + offsetMonths;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return formatYearMonth(year, month);
}

/** Calculate bar width in pixels from start and end months */
export function barWidthPx(
  startMonth: string,
  endMonth: string,
  monthWidth: number = DEFAULT_MONTH_WIDTH
): number {
  return monthsBetween(startMonth, endMonth) * monthWidth;
}

/** Generate array of months between start and end (inclusive) */
export function generateMonthRange(start: string, end: string): string[] {
  const s = parseYearMonth(start);
  const e = parseYearMonth(end);
  const months: string[] = [];
  let y = s.year;
  let m = s.month;
  while (y < e.year || (y === e.year && m <= e.month)) {
    months.push(formatYearMonth(y, m));
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

/** Get quarter label (Q1-Q4) from month number (fiscal year: Q1=4-6, Q2=7-9, Q3=10-12, Q4=1-3) */
export function monthToQuarter(month: number): string {
  if (month >= 4 && month <= 6) return 'Q1';
  if (month >= 7 && month <= 9) return 'Q2';
  if (month >= 10 && month <= 12) return 'Q3';
  return 'Q4';
}

/** Get month number label */
export function monthAbbr(month: number): string {
  return `${month}`;
}

/** Get the fiscal quarter start month for a given month (Q1=4, Q2=7, Q3=10, Q4=1) */
export function quarterStartMonth(month: number): number {
  if (month >= 4 && month <= 6) return 4;
  if (month >= 7 && month <= 9) return 7;
  if (month >= 10 && month <= 12) return 10;
  return 1;
}

/** Get today as "YYYY-MM" */
export function todayYearMonth(): string {
  const now = new Date();
  return formatYearMonth(now.getFullYear(), now.getMonth() + 1);
}

/** Parse "YYYY-MM" to a Date (1st of the month) */
export function parseDate(ym: string): Date {
  const { year, month } = parseYearMonth(ym);
  return new Date(year, month - 1, 1);
}

/** Days between two YYYY-MM dates (1st of each month) */
export function daysBetween(start: string, end: string): number {
  const s = parseDate(start);
  const e = parseDate(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

/** Convert "YYYY-MM" or "YYYY-MM-DD" to X position using day-based width */
export function dateToXDay(
  date: string,
  timelineStart: string,
  dayWidth: number,
  headerWidth: number,
): number {
  const days = daysBetween2(timelineStart, date);
  return headerWidth + days * dayWidth;
}

/** Convert X position to "YYYY-MM-DD" using day-based width (snap to day) */
export function xToDateDay(
  x: number,
  timelineStart: string,
  dayWidth: number,
  headerWidth: number,
): string {
  const totalDays = Math.round((x - headerWidth) / dayWidth);
  const s = parseDate2(timelineStart);
  const start = new Date(s.year, s.month - 1, s.day);
  const target = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
  return formatYearMonthDay(target.getFullYear(), target.getMonth() + 1, target.getDate());
}

/** Generate array of days in a month */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Format date to short label */
export function formatDateLabel(year: number, month: number, day?: number): string {
  if (day !== undefined) return `${day}`;
  return monthAbbr(month);
}
