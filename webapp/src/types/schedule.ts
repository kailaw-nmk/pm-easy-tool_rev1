export type BarColor =
  | 'blue'
  | 'pink'
  | 'green'
  | 'orange'
  | 'gray'
  | 'purple'
  | 'red'
  | 'security';

export type ZoomLevel = 'day' | 'month' | 'quarter' | 'year';

export type DisplayMode = 'fixed' | 'fit';

export interface LaneTemplate {
  id: string;
  label: string;
  tags: string[];
  defaultHeightPx: number;
}

export interface ScheduleBar {
  id: string;
  label: string;
  startMonth: string; // "2026-04"
  endMonth: string;   // "2026-09"
  color: BarColor;
  yOffsetInLane: number;
  heightPx: number;
  style?: { dashed?: boolean; opacity?: number };
  tooltip?: string;
  memo?: string;
}

export interface Milestone {
  id: string;
  label: string;
  date: string; // "2026-07"
  yOffsetInLane: number;
  xOffsetPx?: number;    // pixel offset from date-snapped X position (free placement)
  widthPx?: number;      // user-defined text area width
  heightPx?: number;     // user-defined text area height
  starXOffset?: number;  // star icon X offset from dateX (independent of text)
  starYOffset?: number;  // star icon Y offset from laneY (independent of text)
  starSize?: number;     // star icon font size
  tooltip?: string;
  memo?: string;
}

export interface SwimLane {
  id: string;
  label: string;
  heightPx: number;
  minHeightPx?: number;
  bars: ScheduleBar[];
  milestones: Milestone[];
  tags?: string[];
  registryId?: string;
}

export type ConnectionLineType = 'straight' | 'orthogonal';

export interface ConnectionAnchor {
  edge: 'top' | 'right' | 'bottom' | 'left';
  position: number; // 0.0〜1.0（辺に沿った正規化位置）
}

export interface Connection {
  id: string;
  fromItemId: string;
  fromLaneId: string;
  toItemId: string;
  toLaneId: string;
  fromAnchor?: ConnectionAnchor;
  toAnchor?: ConnectionAnchor;
  lineType: ConnectionLineType;
  memo?: string;
  color?: string;
  strokeWidth?: number;
}

export interface Annotation {
  id: string;
  type: 'note' | 'copyright';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageTimeline {
  startDate: string;  // "2025-10"
  endDate: string;    // "2028-08"
  monthWidthPx: number;
}

export interface SchedulePage {
  id: string;
  name: string;
  timeline?: PageTimeline;
  swimLanes: SwimLane[];
  annotations: Annotation[];
  connections?: Connection[];
  filterTags?: string[];
}

export interface DisplaySettings {
  fontSizeLaneTitle: number;
  fontSizeBarText: number;
  fontSizeMilestone: number;
  zoomLevel: ZoomLevel;
  displayMode: DisplayMode;
  showTooltips: boolean;
  showMemos: boolean;
  themeMode: 'light' | 'dark';
}

export interface ScheduleData {
  version: string;
  lastModified: string;
  timeline: PageTimeline & {
    laneHeaderWidthPx: number;
  };
  pages: SchedulePage[];
  laneRegistry?: LaneTemplate[];
  settings?: DisplaySettings;
}
