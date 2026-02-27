import { XMLParser } from 'fast-xml-parser';
import type {
  ScheduleData, SchedulePage, SwimLane, ScheduleBar,
  Milestone, Annotation, BarColor, PageTimeline,
} from '../types/schedule';
import { fillColorToBarColor } from './color-map';

interface MxGeometry {
  '@_x'?: string;
  '@_y'?: string;
  '@_width'?: string;
  '@_height'?: string;
}

interface MxCell {
  '@_id': string;
  '@_value'?: string;
  '@_style'?: string;
  '@_vertex'?: string;
  '@_edge'?: string;
  '@_parent'?: string;
  mxGeometry?: MxGeometry;
}

interface MxGraphModel {
  root: { mxCell: MxCell | MxCell[] };
}

interface DiagramNode {
  '@_id': string;
  '@_name': string;
  mxGraphModel: MxGraphModel;
}

function parseStyle(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of style.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      result[part.substring(0, eq)] = part.substring(eq + 1);
    } else if (part) {
      result[part] = 'true';
    }
  }
  return result;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function detectPageTimeline(cells: MxCell[], pageId: string): PageTimeline & { laneHeaderWidthPx: number } {
  // Find month cells to detect monthWidth and timeline range
  const monthCells: { x: number; width: number; value: string }[] = [];
  const MONTH_NAMES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_NAMES_NUM = ['1','2','3','4','5','6','7','8','9','10','11','12'];

  for (const cell of cells) {
    if (!cell['@_vertex'] || !cell.mxGeometry) continue;
    const style = parseStyle(cell['@_style'] ?? '');
    const value = cell['@_value'] ?? '';
    const x = parseFloat(cell.mxGeometry['@_x'] ?? '0');
    const width = parseFloat(cell.mxGeometry['@_width'] ?? '0');
    const y = parseFloat(cell.mxGeometry['@_y'] ?? '0');

    // Month row cells are small, in the 3rd header row
    if (style.fillColor === '#e3f2fd' && style.strokeColor === '#bbdefb' && width < 60) {
      const idx = MONTH_NAMES_EN.indexOf(value);
      const numIdx = MONTH_NAMES_NUM.indexOf(value);
      if (idx >= 0 || numIdx >= 0) {
        monthCells.push({ x, width, value });
      }
    }
  }

  if (monthCells.length === 0) {
    return { startDate: '2025-10', endDate: '2027-08', monthWidthPx: 55, laneHeaderWidthPx: 140 };
  }

  monthCells.sort((a, b) => a.x - b.x);
  const monthWidth = monthCells[0].width;
  const laneHeaderWidth = monthCells[0].x;

  // Find year cells to determine start year
  const yearCells: { x: number; width: number; value: string }[] = [];
  for (const cell of cells) {
    if (!cell['@_vertex'] || !cell.mxGeometry) continue;
    const style = parseStyle(cell['@_style'] ?? '');
    const value = cell['@_value'] ?? '';
    const width = parseFloat(cell.mxGeometry['@_width'] ?? '0');
    if (style.fillColor === '#e3f2fd' && style.strokeColor === '#90caf9' && width > 100) {
      const yearMatch = value.match(/(\d{4})/);
      if (yearMatch) {
        yearCells.push({ x: parseFloat(cell.mxGeometry['@_x'] ?? '0'), width, value: yearMatch[1] });
      }
    }
  }
  yearCells.sort((a, b) => a.x - b.x);

  // Determine start month
  const firstMonthValue = monthCells[0].value;
  const MONTH_NAMES_EN_MAP: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  let startMonth = MONTH_NAMES_EN_MAP[firstMonthValue] ?? parseInt(firstMonthValue) ?? 1;

  let startYear = parseInt(yearCells[0]?.value ?? '2026');
  // If month cells start at Oct-Dec and first year cell is at same position, the year is for that fiscal period
  // Check: for page p0, first month is Oct, first year is 2026 -> startDate = 2025-10
  // The first year cell starts at x=140 and spans Oct-Sep (12 months), labeled "2026年"
  // But Oct-Dec belong to the previous calendar year
  if (startMonth >= 10 && yearCells.length > 0) {
    // First year label is for the fiscal year, e.g. "2026年" but Oct-Dec are in 2025
    startYear = startYear - 1;
  }

  const lastMonthValue = monthCells[monthCells.length - 1].value;
  let endMonth = MONTH_NAMES_EN_MAP[lastMonthValue] ?? parseInt(lastMonthValue) ?? 12;
  let endYear = startYear;
  // Count total months from start
  const totalMonths = monthCells.length;
  const totalStartMonths = (startYear * 12) + startMonth - 1;
  const totalEndMonths = totalStartMonths + totalMonths - 1;
  endYear = Math.floor(totalEndMonths / 12);
  endMonth = (totalEndMonths % 12) + 1;

  const fmt = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

  return {
    startDate: fmt(startYear, startMonth),
    endDate: fmt(endYear, endMonth),
    monthWidthPx: monthWidth,
    laneHeaderWidthPx: laneHeaderWidth,
  };
}

function detectSwimLanes(cells: MxCell[]): { id: string; label: string; yStart: number; yEnd: number }[] {
  const laneCells: { id: string; label: string; y: number; height: number }[] = [];

  for (const cell of cells) {
    if (!cell['@_vertex'] || !cell.mxGeometry) continue;
    const x = parseFloat(cell.mxGeometry['@_x'] ?? '0');
    const width = parseFloat(cell.mxGeometry['@_width'] ?? '0');
    const y = parseFloat(cell.mxGeometry['@_y'] ?? '0');
    const height = parseFloat(cell.mxGeometry['@_height'] ?? '0');
    const style = parseStyle(cell['@_style'] ?? '');
    const value = cell['@_value'] ?? '';

    // Lane labels: x=0, width=140, in the f5f5f5 area, not "日程"
    if (x === 0 && width === 140 && style.fillColor === '#f5f5f5' && value !== '日程') {
      laneCells.push({
        id: `lane_${cell['@_id']}`,
        label: stripHtml(value),
        y,
        height,
      });
    }
  }

  laneCells.sort((a, b) => a.y - b.y);

  return laneCells.map((lane, i) => ({
    id: lane.id,
    label: lane.label,
    yStart: lane.y,
    yEnd: lane.y + lane.height,
  }));
}

function classifyCell(
  cell: MxCell,
  lanes: { id: string; label: string; yStart: number; yEnd: number }[],
  timeline: PageTimeline & { laneHeaderWidthPx: number },
): { type: 'bar' | 'milestone' | 'annotation' | 'skip'; laneId?: string; data?: any } {
  if (!cell['@_vertex'] || !cell.mxGeometry) return { type: 'skip' };

  const style = parseStyle(cell['@_style'] ?? '');
  const value = cell['@_value'] ?? '';
  const x = parseFloat(cell.mxGeometry['@_x'] ?? '0');
  const y = parseFloat(cell.mxGeometry['@_y'] ?? '0');
  const width = parseFloat(cell.mxGeometry['@_width'] ?? '0');
  const height = parseFloat(cell.mxGeometry['@_height'] ?? '0');

  // Skip header cells and lane labels
  if (x === 0 && width === 140) return { type: 'skip' };
  if (style.fillColor === '#e3f2fd' || style.fillColor === '#bbdefb') return { type: 'skip' };
  if (style.fillColor === '#f5f5f5' && style.strokeColor === '#e0e0e0') return { type: 'skip' };

  const strippedValue = stripHtml(value);

  // Find which lane this cell belongs to
  const findLane = () => {
    for (const lane of lanes) {
      if (y >= lane.yStart && y < lane.yEnd) return lane.id;
    }
    // Check last lane's end
    if (lanes.length > 0) {
      const last = lanes[lanes.length - 1];
      if (y >= last.yStart) return last.id;
    }
    return lanes[0]?.id;
  };

  // Milestone: text style with ★
  if (style.text === 'true' || (style[''] === undefined && !style.rounded)) {
    if (strippedValue.startsWith('★') || (style.fontColor === '#d32f2f' && strippedValue.includes('★'))) {
      const laneId = findLane();
      if (!laneId) return { type: 'skip' };

      // Calculate date from x position
      const offsetMonths = Math.round((x - timeline.laneHeaderWidthPx) / timeline.monthWidthPx);
      const startParsed = parseYM(timeline.startDate);
      const totalMonths = (startParsed.year * 12 + startParsed.month - 1) + offsetMonths;
      const dateYear = Math.floor(totalMonths / 12);
      const dateMonth = (totalMonths % 12) + 1;
      const date = `${dateYear}-${String(dateMonth).padStart(2, '0')}`;

      const lane = lanes.find(l => l.id === laneId)!;
      return {
        type: 'milestone',
        laneId,
        data: {
          id: `ms_${cell['@_id']}`,
          label: strippedValue,
          date,
          yOffsetInLane: y - lane.yStart,
        } as Milestone,
      };
    }

    // Large text annotation
    if (width > 200 && height > 40) {
      return {
        type: 'annotation',
        data: {
          id: `ann_${cell['@_id']}`,
          type: strippedValue.includes('©') ? 'copyright' : 'note',
          text: strippedValue,
          x, y, width, height,
        } as Annotation,
      };
    }

    // Copyright
    if (strippedValue.includes('©') || strippedValue.includes('Confidential')) {
      return {
        type: 'annotation',
        data: {
          id: `ann_${cell['@_id']}`,
          type: 'copyright',
          text: strippedValue,
          x, y, width, height,
        } as Annotation,
      };
    }

    return { type: 'skip' };
  }

  // Bar: rounded=1, has fillColor
  if (style.rounded === '1' && style.fillColor && x >= timeline.laneHeaderWidthPx) {
    const laneId = findLane();
    if (!laneId) return { type: 'skip' };

    const fill = style.fillColor;
    const color = fillColorToBarColor(fill);
    const lane = lanes.find(l => l.id === laneId)!;

    // Calculate start/end months
    const startOffset = Math.round((x - timeline.laneHeaderWidthPx) / timeline.monthWidthPx);
    const endOffset = Math.round((x + width - timeline.laneHeaderWidthPx) / timeline.monthWidthPx);
    const startParsed = parseYM(timeline.startDate);
    const startTotal = (startParsed.year * 12 + startParsed.month - 1) + startOffset;
    const endTotal = (startParsed.year * 12 + startParsed.month - 1) + endOffset;

    const startYear = Math.floor(startTotal / 12);
    const startMonth = (startTotal % 12) + 1;
    const endYear = Math.floor(endTotal / 12);
    const endMonth = (endTotal % 12) + 1;

    const fmt = (y2: number, m: number) => `${y2}-${String(m).padStart(2, '0')}`;

    const barData: ScheduleBar = {
      id: `bar_${cell['@_id']}`,
      label: strippedValue,
      startMonth: fmt(startYear, startMonth),
      endMonth: fmt(endYear, endMonth),
      color,
      yOffsetInLane: y - lane.yStart,
      heightPx: height,
      ...(style.dashed === '1' || style.dashPattern ? { style: { dashed: true, opacity: parseFloat(style.opacity ?? '100') / 100 } } : {}),
    };

    return { type: 'bar', laneId, data: barData };
  }

  // Large annotation box
  if (style.rounded === '1' && width > 200 && height > 40 && y > 500) {
    return {
      type: 'annotation',
      data: {
        id: `ann_${cell['@_id']}`,
        type: 'note',
        text: strippedValue,
        x, y, width, height,
      } as Annotation,
    };
  }

  return { type: 'skip' };
}

function parseYM(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number);
  return { year: y, month: m };
}

export function importDrawio(xmlContent: string): ScheduleData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'diagram' || name === 'mxCell',
  });

  const parsed = parser.parse(xmlContent);
  const diagrams: DiagramNode[] = parsed.mxfile.diagram;

  const pages: SchedulePage[] = [];
  let globalTimeline: (PageTimeline & { laneHeaderWidthPx: number }) | null = null;

  for (const diagram of diagrams) {
    const pageId = diagram['@_id'];
    const pageName = diagram['@_name'];
    const cells: MxCell[] = Array.isArray(diagram.mxGraphModel.root.mxCell)
      ? diagram.mxGraphModel.root.mxCell
      : [diagram.mxGraphModel.root.mxCell];

    const timeline = detectPageTimeline(cells, pageId);
    if (!globalTimeline) globalTimeline = timeline;

    const lanes = detectSwimLanes(cells);
    const swimLanes: SwimLane[] = lanes.map(l => ({
      id: l.id,
      label: l.label,
      heightPx: l.yEnd - l.yStart,
      bars: [],
      milestones: [],
    }));

    const annotations: Annotation[] = [];

    for (const cell of cells) {
      const result = classifyCell(cell, lanes, timeline);
      switch (result.type) {
        case 'bar': {
          const lane = swimLanes.find(l => l.id === result.laneId);
          if (lane) lane.bars.push(result.data);
          break;
        }
        case 'milestone': {
          const lane = swimLanes.find(l => l.id === result.laneId);
          if (lane) lane.milestones.push(result.data);
          break;
        }
        case 'annotation':
          annotations.push(result.data);
          break;
      }
    }

    const pageTimeline: PageTimeline | undefined =
      timeline.monthWidthPx !== globalTimeline.monthWidthPx ||
      timeline.startDate !== globalTimeline.startDate
        ? { startDate: timeline.startDate, endDate: timeline.endDate, monthWidthPx: timeline.monthWidthPx }
        : undefined;

    pages.push({
      id: pageId,
      name: pageName,
      timeline: pageTimeline,
      swimLanes,
      annotations,
    });
  }

  return {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    timeline: globalTimeline ?? { startDate: '2025-10', endDate: '2027-08', monthWidthPx: 55, laneHeaderWidthPx: 140 },
    pages,
  };
}
