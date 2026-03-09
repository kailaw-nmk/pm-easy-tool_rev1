export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceSecondary: string;
  surfaceHover: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  accentHover: string;
  danger: string;
  dangerLight: string;
  inputBorder: string;
  inputBg: string;
  shadow: string;
  shadowStrong: string;
  overlayBg: string;
  // SVG-specific
  headerBg: string;
  headerAccentBg: string;
  headerAccentStroke: string;
  headerAccentText: string;
  headerQuarterBg: string;
  headerMonthBg: string;
  headerDayEvenBg: string;
  headerDayOddBg: string;
  headerDayStroke: string;
  laneLabelBg: string;
  laneBorder: string;
  laneLabelText: string;
  chartBg: string;
  selectionStroke: string;
  todayLineColor: string;
  milestoneText: string;
  memoIcon: string;
  tooltipBg: string;
  tooltipText: string;
  // Tag chip
  tagChipBg: string;
  tagChipText: string;
  tagChipRemoveHover: string;
  // Toggle active
  toggleActiveBg: string;
  toggleActiveBorder: string;
  toggleActiveText: string;
  // Zoom/mode active
  segmentActiveBg: string;
  segmentActiveText: string;
  // Save status
  saveStatusDirty: string;
}

export const lightTheme: ThemeColors = {
  bg: '#fafbfc',
  surface: '#ffffff',
  surfaceSecondary: '#f6f8fa',
  surfaceHover: '#f1f3f5',
  border: '#e1e4e8',
  borderLight: '#f0f0f0',
  textPrimary: '#18181b',
  textSecondary: '#71717a',
  textMuted: '#a1a1aa',
  accent: '#3b82f6',
  accentLight: '#eff6ff',
  accentHover: '#2563eb',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  inputBorder: '#d4d4d8',
  inputBg: '#ffffff',
  shadow: 'rgba(0,0,0,0.08)',
  shadowStrong: 'rgba(0,0,0,0.16)',
  overlayBg: 'rgba(0,0,0,0.4)',
  // SVG
  headerBg: '#f4f4f5',
  headerAccentBg: '#eff6ff',
  headerAccentStroke: '#93c5fd',
  headerAccentText: '#2563eb',
  headerQuarterBg: '#dbeafe',
  headerMonthBg: '#eff6ff',
  headerDayEvenBg: '#f0f7ff',
  headerDayOddBg: '#eff6ff',
  headerDayStroke: '#bfdbfe',
  laneLabelBg: '#f4f4f5',
  laneBorder: '#e4e4e7',
  laneLabelText: '#18181b',
  chartBg: '#ffffff',
  selectionStroke: '#3b82f6',
  todayLineColor: '#ef4444',
  milestoneText: '#dc2626',
  memoIcon: '#71717a',
  tooltipBg: '#18181b',
  tooltipText: '#fafafa',
  tagChipBg: '#eff6ff',
  tagChipText: '#3b82f6',
  tagChipRemoveHover: '#ef4444',
  toggleActiveBg: '#eff6ff',
  toggleActiveBorder: '#93bbfc',
  toggleActiveText: '#3b82f6',
  segmentActiveBg: '#3b82f6',
  segmentActiveText: '#ffffff',
  saveStatusDirty: '#ea580c',
};

export const darkTheme: ThemeColors = {
  bg: '#0d1117',
  surface: '#161b22',
  surfaceSecondary: '#21262d',
  surfaceHover: '#30363d',
  border: '#30363d',
  borderLight: '#21262d',
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  accent: '#60a5fa',
  accentLight: '#1e3a5f',
  accentHover: '#93c5fd',
  danger: '#f87171',
  dangerLight: '#451a1a',
  inputBorder: '#52525b',
  inputBg: '#27272a',
  shadow: 'rgba(0,0,0,0.3)',
  shadowStrong: 'rgba(0,0,0,0.5)',
  overlayBg: 'rgba(0,0,0,0.6)',
  // SVG
  headerBg: '#27272a',
  headerAccentBg: '#1e3a5f',
  headerAccentStroke: '#1e40af',
  headerAccentText: '#60a5fa',
  headerQuarterBg: '#1e3a5f',
  headerMonthBg: '#1e293b',
  headerDayEvenBg: '#1e293b',
  headerDayOddBg: '#1e3a5f',
  headerDayStroke: '#1e40af',
  laneLabelBg: '#27272a',
  laneBorder: '#3f3f46',
  laneLabelText: '#fafafa',
  chartBg: '#18181b',
  selectionStroke: '#60a5fa',
  todayLineColor: '#f87171',
  milestoneText: '#f87171',
  memoIcon: '#a1a1aa',
  tooltipBg: '#fafafa',
  tooltipText: '#18181b',
  tagChipBg: '#1e3a5f',
  tagChipText: '#60a5fa',
  tagChipRemoveHover: '#f87171',
  toggleActiveBg: '#1e3a5f',
  toggleActiveBorder: '#3d6fad',
  toggleActiveText: '#60a5fa',
  segmentActiveBg: '#60a5fa',
  segmentActiveText: '#09090b',
  saveStatusDirty: '#fb923c',
};

export function getTheme(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkTheme : lightTheme;
}
