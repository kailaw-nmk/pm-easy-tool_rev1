import type { PageTimeline, ZoomLevel } from '../types/schedule';
import { todayYearMonth, todayYearMonthDay } from './date-utils';
import { itemX } from './position';
import { isDayBased } from './zoom';

export function scrollToToday(
  container: HTMLDivElement,
  timeline: PageTimeline,
  headerWidth: number,
  zoomLevel: ZoomLevel,
): void {
  const today = isDayBased(zoomLevel) ? todayYearMonthDay() : todayYearMonth();
  const todayX = itemX(today, { timeline, headerWidth, zoomLevel });
  const targetScrollLeft = todayX - container.clientWidth * 0.25;
  container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
}
