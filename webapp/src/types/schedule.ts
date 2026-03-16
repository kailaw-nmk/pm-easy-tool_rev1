export type BarColor = string;

export type ZoomLevel = 'day' | 'month' | 'quarter' | 'year';

export type DisplayMode = 'fixed' | 'fit';

export interface LaneTemplate {
  id: string;
  label: string;
  tags: string[];
  defaultHeightPx: number;
}

export interface DisplayBox {
  dx: number;
  dy: number;
  width: number;
  height: number;
  fontSize: number;
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
  tooltipDisplay?: DisplayBox;
  memoDisplay?: DisplayBox;
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
  color?: string;        // custom color (hex or legacy name)
  tooltip?: string;
  memo?: string;
  tooltipDisplay?: DisplayBox;
  memoDisplay?: DisplayBox;
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

export interface ScheduleLine {
  id: string;
  sourceItemId: string;   // マイルストーンID
  sourceLaneId: string;   // マイルストーンが属するレーンID
  color: string;          // デフォルト '#3b82f6' (青)
  strokeWidth: number;    // デフォルト 1.5
  lineStyle: 'solid' | 'dashed' | 'dotted'; // デフォルト 'dashed'
  label?: string;
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

export interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  textColor: string;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  arrowTargetItemId?: string;
  arrowTargetLaneId?: string;
  arrowColor?: string;
  arrowStrokeWidth?: number;
}

export interface SchedulePage {
  id: string;
  name: string;
  timeline?: PageTimeline;
  swimLanes: SwimLane[];
  annotations: Annotation[];
  connections?: Connection[];
  scheduleLines?: ScheduleLine[];
  textBoxes?: TextBox[];
  filterTags?: string[];
}

export interface DisplaySettings {
  fontSizeLaneTitle: number;
  fontSizeBarText: number;
  fontSizeMilestone: number;
  fontSizeCalendar: number;
  fontSizeTipMemo?: number;
  fontSizeTextBox?: number;
  zoomLevel: ZoomLevel;
  displayMode: DisplayMode;
  showTooltips: boolean;
  showMemos: boolean;
  themeMode: 'light' | 'dark';
}

export interface ScheduleData {
  version: string;
  lastModified: string;
  memo?: string;
  timeline: PageTimeline & {
    laneHeaderWidthPx: number;
  };
  pages: SchedulePage[];
  laneRegistry?: LaneTemplate[];
  settings?: DisplaySettings;
}

export interface PartialScheduleExport {
  exportType: 'partial';
  version: string;
  exportedAt: string;
  pages: SchedulePage[];
  laneRegistry: LaneTemplate[];
}

export type ConflictResolution = 'add' | 'overwrite' | 'skip';
