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
