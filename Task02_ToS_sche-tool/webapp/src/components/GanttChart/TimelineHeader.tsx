import React, { useMemo } from 'react';
import type { PageTimeline, ZoomLevel } from '../../types/schedule';
import { generateMonthRange, parseYearMonth, monthToQuarter, monthAbbr, daysInMonth } from '../../lib/date-utils';
import { YEAR_HEADER_Y, QUARTER_HEADER_Y, MONTH_HEADER_Y, YEAR_HEADER_HEIGHT, QUARTER_HEADER_HEIGHT, MONTH_HEADER_HEIGHT } from '../../lib/constants';
import { getZoomConfig, getDayWidth } from '../../lib/zoom';

interface Props {
  timeline: PageTimeline;
  headerWidth: number;
  zoomLevel?: ZoomLevel;
}

interface YearSpan {
  year: number;
  startX: number;
  width: number;
}

interface QuarterSpan {
  label: string;
  startX: number;
  width: number;
}

export function TimelineHeader({ timeline, headerWidth, zoomLevel = 'month' }: Props) {
  const config = getZoomConfig(zoomLevel);

  const months = useMemo(
    () => generateMonthRange(timeline.startDate, timeline.endDate),
    [timeline.startDate, timeline.endDate]
  );

  const { yearSpans, quarterSpans } = useMemo(() => {
    const years: YearSpan[] = [];
    const quarters: QuarterSpan[] = [];
    let currentYear = -1;
    let currentQ = '';

    for (let i = 0; i < months.length; i++) {
      const { year, month } = parseYearMonth(months[i]);
      let x: number;
      if (config.useDayWidth) {
        const dayWidth = getDayWidth(timeline.monthWidthPx);
        const startDate = parseYearMonth(timeline.startDate);
        const startMs = new Date(startDate.year, startDate.month - 1, 1).getTime();
        const currentMs = new Date(year, month - 1, 1).getTime();
        const days = Math.round((currentMs - startMs) / (1000 * 60 * 60 * 24));
        x = headerWidth + days * dayWidth;
      } else {
        x = headerWidth + i * timeline.monthWidthPx;
      }

      // Year spans
      if (year !== currentYear) {
        if (currentYear > 0 && years.length > 0) {
          years[years.length - 1].width = x - years[years.length - 1].startX;
        }
        years.push({ year, startX: x, width: 0 });
        currentYear = year;
      }

      // Quarter spans
      if (config.headers.includes('quarter')) {
        const q = monthToQuarter(month);
        const qKey = `${year}-${q}`;
        if (qKey !== currentQ) {
          if (currentQ && quarters.length > 0) {
            quarters[quarters.length - 1].width = x - quarters[quarters.length - 1].startX;
          }
          quarters.push({ label: q, startX: x, width: 0 });
          currentQ = qKey;
        }
      }
    }

    // Close last spans
    let totalWidth: number;
    if (config.useDayWidth) {
      const dayWidth = getDayWidth(timeline.monthWidthPx);
      const startDate = parseYearMonth(timeline.startDate);
      const endDate = parseYearMonth(timeline.endDate);
      const startMs = new Date(startDate.year, startDate.month - 1, 1).getTime();
      const endMs = new Date(endDate.year, endDate.month, 1).getTime(); // 1 month past end
      const days = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
      totalWidth = headerWidth + days * dayWidth;
    } else {
      totalWidth = headerWidth + months.length * timeline.monthWidthPx;
    }

    if (years.length > 0) years[years.length - 1].width = totalWidth - years[years.length - 1].startX;
    if (quarters.length > 0) quarters[quarters.length - 1].width = totalWidth - quarters[quarters.length - 1].startX;

    return { yearSpans: years, quarterSpans: quarters };
  }, [months, headerWidth, timeline.monthWidthPx, config, timeline.startDate, timeline.endDate]);

  // Calculate header row positions based on which headers are shown
  const headerRows = config.headers;
  const rowY = (index: number) => YEAR_HEADER_Y + index * (YEAR_HEADER_HEIGHT + 2);
  const totalHeaderHeight = headerRows.length * (YEAR_HEADER_HEIGHT + 2);

  return (
    <g className="timeline-header">
      {/* "日程" label */}
      <rect x={0} y={YEAR_HEADER_Y} width={headerWidth} height={totalHeaderHeight}
        fill="#f5f5f5" stroke="#e0e0e0" strokeWidth={1} />
      <text x={headerWidth / 2} y={YEAR_HEADER_Y + totalHeaderHeight / 2}
        textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight="bold" fill="#333">
        日程
      </text>

      {/* Year row */}
      {headerRows.includes('year') && yearSpans.map((ys) => {
        const yPos = rowY(headerRows.indexOf('year'));
        return (
          <g key={`year-${ys.year}`}>
            <rect x={ys.startX} y={yPos} width={ys.width} height={YEAR_HEADER_HEIGHT}
              fill="#e3f2fd" stroke="#90caf9" strokeWidth={1} />
            <text x={ys.startX + ys.width / 2} y={yPos + YEAR_HEADER_HEIGHT / 2}
              textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold" fill="#1565c0">
              {ys.year}年
            </text>
          </g>
        );
      })}

      {/* Quarter row */}
      {headerRows.includes('quarter') && quarterSpans.map((qs, i) => {
        const yPos = rowY(headerRows.indexOf('quarter'));
        return (
          <g key={`q-${i}`}>
            <rect x={qs.startX} y={yPos} width={qs.width} height={QUARTER_HEADER_HEIGHT}
              fill="#bbdefb" stroke="#90caf9" strokeWidth={1} />
            <text x={qs.startX + qs.width / 2} y={yPos + QUARTER_HEADER_HEIGHT / 2}
              textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold" fill="#1565c0">
              {qs.label}
            </text>
          </g>
        );
      })}

      {/* Month row */}
      {headerRows.includes('month') && months.map((m, i) => {
        const { year, month } = parseYearMonth(m);
        const yPos = rowY(headerRows.indexOf('month'));
        let x: number;
        let w: number;
        if (config.useDayWidth) {
          const dayWidth = getDayWidth(timeline.monthWidthPx);
          const startDate = parseYearMonth(timeline.startDate);
          const startMs = new Date(startDate.year, startDate.month - 1, 1).getTime();
          const currentMs = new Date(year, month - 1, 1).getTime();
          const days = Math.round((currentMs - startMs) / (1000 * 60 * 60 * 24));
          x = headerWidth + days * dayWidth;
          w = daysInMonth(year, month) * dayWidth;
        } else {
          x = headerWidth + i * timeline.monthWidthPx;
          w = timeline.monthWidthPx;
        }
        return (
          <g key={`month-${m}`}>
            <rect x={x} y={yPos} width={w} height={MONTH_HEADER_HEIGHT}
              fill="#e3f2fd" stroke="#bbdefb" strokeWidth={1} />
            <text x={x + w / 2} y={yPos + MONTH_HEADER_HEIGHT / 2}
              textAnchor="middle" dominantBaseline="central" fontSize={8} fill="#333">
              {monthAbbr(month)}
            </text>
          </g>
        );
      })}

      {/* Day row (day zoom only) */}
      {headerRows.includes('day') && (() => {
        const dayWidth = getDayWidth(timeline.monthWidthPx);
        const yPos = rowY(headerRows.indexOf('day'));
        const elements: React.ReactElement[] = [];
        const startDate = parseYearMonth(timeline.startDate);
        let dayOffset = 0;

        for (const m of months) {
          const { year, month } = parseYearMonth(m);
          const numDays = daysInMonth(year, month);
          for (let d = 1; d <= numDays; d++) {
            const x = headerWidth + dayOffset * dayWidth;
            elements.push(
              <g key={`day-${m}-${d}`}>
                <rect x={x} y={yPos} width={dayWidth} height={MONTH_HEADER_HEIGHT}
                  fill={d % 2 === 0 ? '#f0f7ff' : '#e3f2fd'} stroke="#bbdefb" strokeWidth={0.5} />
                <text x={x + dayWidth / 2} y={yPos + MONTH_HEADER_HEIGHT / 2}
                  textAnchor="middle" dominantBaseline="central" fontSize={7} fill="#666">
                  {d}
                </text>
              </g>
            );
            dayOffset++;
          }
        }
        return elements;
      })()}
    </g>
  );
}
