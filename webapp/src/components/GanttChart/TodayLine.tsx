import type { PageTimeline, ZoomLevel } from '../../types/schedule';
import { monthToX, todayYearMonth, todayYearMonthDay, dateToXDay } from '../../lib/date-utils';
import { getDayWidth, isDayBased } from '../../lib/zoom';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Props {
  timeline: PageTimeline;
  headerWidth: number;
  chartHeight: number;
  zoomLevel?: ZoomLevel;
  region?: 'header' | 'body' | 'full';
}

export function TodayLine({ timeline, headerWidth, chartHeight, zoomLevel = 'month', region = 'full' }: Props) {
  const tc = useThemeColors();
  let x: number;

  if (isDayBased(zoomLevel)) {
    const today = todayYearMonthDay();
    const dayWidth = getDayWidth(timeline.monthWidthPx);
    x = dateToXDay(today, timeline.startDate, dayWidth, headerWidth);
  } else {
    const today = todayYearMonth();
    x = monthToX(today, timeline.startDate, timeline.monthWidthPx, headerWidth);
  }

  // Only render if within visible range
  if (x < headerWidth) return null;

  return (
    <g className="today-line">
      {/* Vertical line: body or full */}
      {(region === 'body' || region === 'full') && (
        <line
          x1={x}
          y1={region === 'full' ? 20 : 0}
          x2={x}
          y2={chartHeight}
          stroke={tc.todayLineColor}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      )}
      {/* Text label: header or full */}
      {(region === 'header' || region === 'full') && (
        <text
          x={x}
          y={14}
          textAnchor="middle"
          fontSize={7}
          fill={tc.todayLineColor}
          fontWeight="bold"
        >
          Today
        </text>
      )}
    </g>
  );
}
