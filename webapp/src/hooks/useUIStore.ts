import { create } from 'zustand';
import type { ZoomLevel, DisplayMode, DisplaySettings, ConnectionAnchor } from '../types/schedule';
import type { ThemeMode } from '../lib/theme';
import { loadSettingsFromStorage, saveSettingsToStorage } from '../lib/storage';

type PlacementMode = 'none' | 'bar' | 'milestone' | 'connect' | 'textbox';

function extractSettings(state: UIState): DisplaySettings {
  return {
    fontSizeLaneTitle: state.fontSizeLaneTitle,
    fontSizeBarText: state.fontSizeBarText,
    fontSizeMilestone: state.fontSizeMilestone,
    fontSizeCalendar: state.fontSizeCalendar,
    fontSizeTipMemo: state.fontSizeTipMemo,
    fontSizeTextBox: state.fontSizeTextBox,
    zoomLevel: state.zoomLevel,
    displayMode: state.displayMode,
    showTooltips: state.showTooltips,
    showMemos: state.showMemos,
    showMonthGridLines: state.showMonthGridLines,
    themeMode: state.themeMode,
    defaultConnectionColor: state.defaultConnectionColor,
    defaultConnectionStrokeWidth: state.defaultConnectionStrokeWidth,
    defaultScheduleLineColor: state.defaultScheduleLineColor,
    defaultScheduleLineStrokeWidth: state.defaultScheduleLineStrokeWidth,
    defaultScheduleLineStyle: state.defaultScheduleLineStyle,
  };
}

let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSettingsSave(getState: () => UIState) {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(() => {
    const settings = extractSettings(getState());
    saveSettingsToStorage(settings);
  }, 1000);
}

interface ConnectFrom {
  itemId: string;
  laneId: string;
  anchor: ConnectionAnchor;
}

interface UIState {
  showTooltips: boolean;
  showMemos: boolean;
  showMonthGridLines: boolean;
  zoomLevel: ZoomLevel;
  placementMode: PlacementMode;
  fontSizeLaneTitle: number;
  fontSizeBarText: number;
  fontSizeMilestone: number;
  fontSizeCalendar: number;
  fontSizeTipMemo: number;
  fontSizeTextBox: number;
  displayMode: DisplayMode;
  containerWidth: number;
  containerHeight: number;
  themeMode: ThemeMode;
  connectFrom: ConnectFrom | null;
  showHome: boolean;
  // 接続線デフォルト
  defaultConnectionColor: string;
  defaultConnectionStrokeWidth: number;
  // スケジュールラインデフォルト
  defaultScheduleLineColor: string;
  defaultScheduleLineStrokeWidth: number;
  defaultScheduleLineStyle: 'solid' | 'dashed' | 'dotted';
  toggleTooltips: () => void;
  toggleMemos: () => void;
  toggleMonthGridLines: () => void;
  setZoomLevel: (level: ZoomLevel) => void;
  setPlacementMode: (mode: PlacementMode) => void;
  setFontSizeLaneTitle: (size: number) => void;
  setFontSizeBarText: (size: number) => void;
  setFontSizeMilestone: (size: number) => void;
  setFontSizeCalendar: (size: number) => void;
  setFontSizeTipMemo: (size: number) => void;
  setFontSizeTextBox: (size: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setContainerWidth: (width: number) => void;
  setContainerHeight: (height: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setConnectFrom: (from: ConnectFrom) => void;
  clearConnectFrom: () => void;
  setShowHome: (show: boolean) => void;
  setDefaultConnectionColor: (color: string) => void;
  setDefaultConnectionStrokeWidth: (width: number) => void;
  setDefaultScheduleLineColor: (color: string) => void;
  setDefaultScheduleLineStrokeWidth: (width: number) => void;
  setDefaultScheduleLineStyle: (style: 'solid' | 'dashed' | 'dotted') => void;
  loadSettings: () => Promise<void>;
  applySettings: (settings: DisplaySettings) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  showTooltips: true,
  showMemos: true,
  showMonthGridLines: false,
  zoomLevel: 'month',
  placementMode: 'none',
  fontSizeLaneTitle: 8,
  fontSizeBarText: 7,
  fontSizeMilestone: 7,
  fontSizeCalendar: 10,
  fontSizeTipMemo: 10,
  fontSizeTextBox: 12,
  displayMode: 'fixed',
  containerWidth: 0,
  containerHeight: 0,
  themeMode: 'light',
  connectFrom: null,
  showHome: false,
  defaultConnectionColor: '#6b7280',
  defaultConnectionStrokeWidth: 1.5,
  defaultScheduleLineColor: '#3b82f6',
  defaultScheduleLineStrokeWidth: 1.5,
  defaultScheduleLineStyle: 'dashed',

  toggleTooltips: () => set((s) => {
    const next = { showTooltips: !s.showTooltips };
    setTimeout(() => scheduleSettingsSave(get), 0);
    return next;
  }),
  toggleMemos: () => set((s) => {
    const next = { showMemos: !s.showMemos };
    setTimeout(() => scheduleSettingsSave(get), 0);
    return next;
  }),
  toggleMonthGridLines: () => set((s) => {
    const next = { showMonthGridLines: !s.showMonthGridLines };
    setTimeout(() => scheduleSettingsSave(get), 0);
    return next;
  }),
  setZoomLevel: (level) => {
    set({ zoomLevel: level });
    scheduleSettingsSave(get);
  },
  setPlacementMode: (mode) => set({ placementMode: mode, connectFrom: null }),
  setFontSizeLaneTitle: (size) => {
    set({ fontSizeLaneTitle: size });
    scheduleSettingsSave(get);
  },
  setFontSizeBarText: (size) => {
    set({ fontSizeBarText: size });
    scheduleSettingsSave(get);
  },
  setFontSizeMilestone: (size) => {
    set({ fontSizeMilestone: size });
    scheduleSettingsSave(get);
  },
  setFontSizeCalendar: (size) => {
    set({ fontSizeCalendar: size });
    scheduleSettingsSave(get);
  },
  setFontSizeTipMemo: (size) => {
    set({ fontSizeTipMemo: size });
    scheduleSettingsSave(get);
  },
  setFontSizeTextBox: (size) => {
    set({ fontSizeTextBox: size });
    scheduleSettingsSave(get);
  },
  setDisplayMode: (mode) => {
    set({ displayMode: mode });
    scheduleSettingsSave(get);
  },
  setContainerWidth: (width) => set({ containerWidth: width }),
  setContainerHeight: (height) => set({ containerHeight: height }),
  setConnectFrom: (from) => set({ connectFrom: from }),
  clearConnectFrom: () => set({ connectFrom: null }),
  setShowHome: (show) => set({ showHome: show }),
  setDefaultConnectionColor: (color) => {
    set({ defaultConnectionColor: color });
    scheduleSettingsSave(get);
  },
  setDefaultConnectionStrokeWidth: (width) => {
    set({ defaultConnectionStrokeWidth: width });
    scheduleSettingsSave(get);
  },
  setDefaultScheduleLineColor: (color) => {
    set({ defaultScheduleLineColor: color });
    scheduleSettingsSave(get);
  },
  setDefaultScheduleLineStrokeWidth: (width) => {
    set({ defaultScheduleLineStrokeWidth: width });
    scheduleSettingsSave(get);
  },
  setDefaultScheduleLineStyle: (style) => {
    set({ defaultScheduleLineStyle: style });
    scheduleSettingsSave(get);
  },
  setThemeMode: (mode) => {
    try { localStorage.setItem('app-theme', mode); } catch {}
    set({ themeMode: mode });
    scheduleSettingsSave(get);
  },
  toggleTheme: () => set((s) => {
    const next = s.themeMode === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('app-theme', next); } catch {}
    setTimeout(() => scheduleSettingsSave(get), 0);
    return { themeMode: next };
  }),

  loadSettings: async () => {
    const settings = loadSettingsFromStorage();
    if (!settings) return;
    get().applySettings(settings);
  },

  applySettings: (settings: DisplaySettings) => {
    set({
      fontSizeLaneTitle: settings.fontSizeLaneTitle ?? 8,
      fontSizeBarText: settings.fontSizeBarText ?? 7,
      fontSizeMilestone: settings.fontSizeMilestone ?? 7,
      fontSizeCalendar: settings.fontSizeCalendar ?? 10,
      fontSizeTipMemo: (settings as any).fontSizeTipMemo ?? 10,
      fontSizeTextBox: (settings as any).fontSizeTextBox ?? 12,
      zoomLevel: settings.zoomLevel ?? 'month',
      displayMode: settings.displayMode ?? 'fixed',
      showTooltips: settings.showTooltips ?? true,
      showMemos: settings.showMemos ?? true,
      showMonthGridLines: (settings as any).showMonthGridLines ?? false,
      themeMode: settings.themeMode ?? 'light',
      defaultConnectionColor: settings.defaultConnectionColor ?? '#6b7280',
      defaultConnectionStrokeWidth: settings.defaultConnectionStrokeWidth ?? 1.5,
      defaultScheduleLineColor: settings.defaultScheduleLineColor ?? '#3b82f6',
      defaultScheduleLineStrokeWidth: settings.defaultScheduleLineStrokeWidth ?? 1.5,
      defaultScheduleLineStyle: settings.defaultScheduleLineStyle ?? 'dashed',
    });
    if (settings.themeMode) {
      try { localStorage.setItem('app-theme', settings.themeMode); } catch {}
    }
  },
}));
