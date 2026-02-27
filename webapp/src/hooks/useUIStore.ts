import { create } from 'zustand';
import type { ZoomLevel, DisplayMode } from '../types/schedule';

type PlacementMode = 'none' | 'bar' | 'milestone';

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
  toggleTooltips: () => void;
  toggleMemos: () => void;
  setZoomLevel: (level: ZoomLevel) => void;
  setPlacementMode: (mode: PlacementMode) => void;
  setFontSizeLaneTitle: (size: number) => void;
  setFontSizeBarText: (size: number) => void;
  setFontSizeMilestone: (size: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setContainerWidth: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showTooltips: true,
  showMemos: true,
  zoomLevel: 'month',
  placementMode: 'none',
  fontSizeLaneTitle: 8,
  fontSizeBarText: 7,
  fontSizeMilestone: 7,
  displayMode: 'fixed',
  containerWidth: 0,

  toggleTooltips: () => set((s) => ({ showTooltips: !s.showTooltips })),
  toggleMemos: () => set((s) => ({ showMemos: !s.showMemos })),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setPlacementMode: (mode) => set({ placementMode: mode }),
  setFontSizeLaneTitle: (size) => set({ fontSizeLaneTitle: size }),
  setFontSizeBarText: (size) => set({ fontSizeBarText: size }),
  setFontSizeMilestone: (size) => set({ fontSizeMilestone: size }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setContainerWidth: (width) => set({ containerWidth: width }),
}));
