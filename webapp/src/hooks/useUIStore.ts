import { create } from 'zustand';
import type { ZoomLevel, DisplayMode, DisplaySettings } from '../types/schedule';
import type { ThemeMode } from '../lib/theme';
import { loadSettingsFromStorage, saveSettingsToStorage } from '../lib/storage';

type PlacementMode = 'none' | 'bar' | 'milestone';

function extractSettings(state: UIState): DisplaySettings {
  return {
    fontSizeLaneTitle: state.fontSizeLaneTitle,
    fontSizeBarText: state.fontSizeBarText,
    fontSizeMilestone: state.fontSizeMilestone,
    zoomLevel: state.zoomLevel,
    displayMode: state.displayMode,
    showTooltips: state.showTooltips,
    showMemos: state.showMemos,
    themeMode: state.themeMode,
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

interface UIState {
  showTooltips: boolean;
  showMemos: boolean;
  zoomLevel: ZoomLevel;
  placementMode: PlacementMode;
  fontSizeLaneTitle: number;
  fontSizeBarText: number;
  fontSizeMilestone: number;
  displayMode: DisplayMode;
  containerWidth: number;
  themeMode: ThemeMode;
  toggleTooltips: () => void;
  toggleMemos: () => void;
  setZoomLevel: (level: ZoomLevel) => void;
  setPlacementMode: (mode: PlacementMode) => void;
  setFontSizeLaneTitle: (size: number) => void;
  setFontSizeBarText: (size: number) => void;
  setFontSizeMilestone: (size: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setContainerWidth: (width: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  loadSettings: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => ({
  showTooltips: true,
  showMemos: true,
  zoomLevel: 'month',
  placementMode: 'none',
  fontSizeLaneTitle: 8,
  fontSizeBarText: 7,
  fontSizeMilestone: 7,
  displayMode: 'fixed',
  containerWidth: 0,
  themeMode: 'light',

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
  setZoomLevel: (level) => {
    set({ zoomLevel: level });
    scheduleSettingsSave(get);
  },
  setPlacementMode: (mode) => set({ placementMode: mode }),
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
  setDisplayMode: (mode) => {
    set({ displayMode: mode });
    scheduleSettingsSave(get);
  },
  setContainerWidth: (width) => set({ containerWidth: width }),
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
    set({
      fontSizeLaneTitle: settings.fontSizeLaneTitle ?? 8,
      fontSizeBarText: settings.fontSizeBarText ?? 7,
      fontSizeMilestone: settings.fontSizeMilestone ?? 7,
      zoomLevel: settings.zoomLevel ?? 'month',
      displayMode: settings.displayMode ?? 'fixed',
      showTooltips: settings.showTooltips ?? true,
      showMemos: settings.showMemos ?? true,
      themeMode: settings.themeMode ?? 'light',
    });
    if (settings.themeMode) {
      try { localStorage.setItem('app-theme', settings.themeMode); } catch {}
    }
  },
}));
