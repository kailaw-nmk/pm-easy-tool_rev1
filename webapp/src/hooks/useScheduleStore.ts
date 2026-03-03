import { create } from 'zustand';
import { produce } from 'immer';
import type { ScheduleData, ScheduleBar, Milestone, SchedulePage, SwimLane, LaneTemplate, Connection, ScheduleLine } from '../types/schedule';
import { AUTO_SAVE_DELAY_MS } from '../lib/constants';
import { migrateData } from '../lib/migration';
import { loadScheduleFromStorage, saveScheduleToStorage } from '../lib/storage';

interface HistoryEntry {
  data: ScheduleData;
}

interface ScheduleState {
  data: ScheduleData | null;
  currentPageId: string;
  isDirty: boolean;
  isSaving: boolean;
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  // Actions
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  setCurrentPage: (pageId: string) => void;
  // Bar operations
  updateBar: (pageId: string, laneId: string, barId: string, updates: Partial<ScheduleBar>) => void;
  addBar: (pageId: string, laneId: string, bar: ScheduleBar) => void;
  deleteBar: (pageId: string, laneId: string, barId: string) => void;
  duplicateBar: (pageId: string, laneId: string, barId: string) => void;
  // Milestone operations
  updateMilestone: (pageId: string, laneId: string, msId: string, updates: Partial<Milestone>) => void;
  addMilestone: (pageId: string, laneId: string, ms: Milestone) => void;
  deleteMilestone: (pageId: string, laneId: string, msId: string) => void;
  // Timeline operations
  updateTimeline: (updates: { startDate?: string; endDate?: string }) => void;
  // Lane operations
  updateLaneHeight: (pageId: string, laneId: string, heightPx: number) => void;
  addLane: (pageId: string, lane: SwimLane) => void;
  addLaneFromTemplate: (pageId: string, templateId: string) => void;
  removeLane: (pageId: string, laneId: string) => void;
  reorderLane: (pageId: string, laneId: string, direction: 'up' | 'down') => void;
  moveLane: (pageId: string, laneId: string, newIndex: number) => void;
  // Tag operations
  updateLaneTags: (pageId: string, laneId: string, tags: string[]) => void;
  // Registry operations
  updateRegistryTemplate: (templateId: string, updates: Partial<LaneTemplate>) => void;
  addRegistryTemplate: (template: LaneTemplate) => void;
  removeRegistryTemplate: (templateId: string) => void;
  // Page management
  addPage: (name: string, selectedTemplateIds: string[]) => void;
  removePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  reorderPage: (pageId: string, direction: 'left' | 'right') => void;
  movePageToIndex: (pageId: string, newIndex: number) => void;
  // Page-specific timeline
  updatePageTimeline: (pageId: string, updates: { startDate?: string; endDate?: string }) => void;
  updatePageMonthWidth: (pageId: string, widthPx: number) => void;
  // Timeline
  updateMonthWidth: (widthPx: number) => void;
  // Connection operations
  addConnection: (pageId: string, connection: Connection) => void;
  updateConnection: (pageId: string, connectionId: string, updates: Partial<Connection>) => void;
  deleteConnection: (pageId: string, connectionId: string) => void;
  // ScheduleLine operations
  addScheduleLine: (pageId: string, line: ScheduleLine) => void;
  updateScheduleLine: (pageId: string, lineId: string, updates: Partial<ScheduleLine>) => void;
  deleteScheduleLine: (pageId: string, lineId: string) => void;
  // Import/Export
  importData: (data: ScheduleData) => void;
  downloadData: () => Promise<void>;
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

function pushHistory(state: ScheduleState): Partial<ScheduleState> {
  if (!state.data) return {};
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({ data: JSON.parse(JSON.stringify(state.data)) });
  // Limit history size
  if (newHistory.length > 50) newHistory.shift();
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function scheduleAutoSave(saveData: () => Promise<void>) {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveData();
  }, AUTO_SAVE_DELAY_MS);
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  data: null,
  currentPageId: 'p0',
  isDirty: false,
  isSaving: false,
  history: [],
  historyIndex: -1,

  loadData: async () => {
    const raw = loadScheduleFromStorage();
    if (!raw) {
      set({ data: null });
      return;
    }
    const data = migrateData(raw);
    set({
      data,
      isDirty: false,
      history: [{ data: JSON.parse(JSON.stringify(data)) }],
      historyIndex: 0,
      currentPageId: data.pages[0]?.id ?? 'p0',
    });
  },

  saveData: async () => {
    const { data } = get();
    if (!data) return;
    set({ isSaving: true });
    try {
      saveScheduleToStorage(data);
      set({ isDirty: false, isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  setCurrentPage: (pageId: string) => set({ currentPageId: pageId }),

  updateTimeline: (updates) => {
    set((state) => {
      if (!state.data) return {};
      // Validate: startDate must be before endDate
      const newStart = updates.startDate ?? state.data.timeline.startDate;
      const newEnd = updates.endDate ?? state.data.timeline.endDate;
      if (newStart >= newEnd) return {};
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data, (draft) => {
        if (updates.startDate) draft.timeline.startDate = updates.startDate;
        if (updates.endDate) draft.timeline.endDate = updates.endDate;
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updateBar: (pageId, laneId, barId, updates) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        const bar = lane.bars.find((b) => b.id === barId);
        if (!bar) return;
        Object.assign(bar, updates);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addBar: (pageId, laneId, bar) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        lane.bars.push(bar);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  deleteBar: (pageId, laneId, barId) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        lane.bars = lane.bars.filter((b) => b.id !== barId);
        if (page.connections) {
          page.connections = page.connections.filter(
            (c) => c.fromItemId !== barId && c.toItemId !== barId
          );
        }
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  duplicateBar: (pageId, laneId, barId) => {
    const { data } = get();
    if (!data) return;
    const page = data.pages.find((p) => p.id === pageId);
    if (!page) return;
    const lane = page.swimLanes.find((l) => l.id === laneId);
    if (!lane) return;
    const bar = lane.bars.find((b) => b.id === barId);
    if (!bar) return;
    const newBar: ScheduleBar = {
      ...JSON.parse(JSON.stringify(bar)),
      id: `bar_${Date.now()}`,
      yOffsetInLane: bar.yOffsetInLane + bar.heightPx + 4,
    };
    get().addBar(pageId, laneId, newBar);
  },

  updateMilestone: (pageId, laneId, msId, updates) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        const ms = lane.milestones.find((m) => m.id === msId);
        if (!ms) return;
        Object.assign(ms, updates);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addMilestone: (pageId, laneId, ms) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        lane.milestones.push(ms);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  deleteMilestone: (pageId, laneId, msId) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        lane.milestones = lane.milestones.filter((m) => m.id !== msId);
        if (page.connections) {
          page.connections = page.connections.filter(
            (c) => c.fromItemId !== msId && c.toItemId !== msId
          );
        }
        if (page.scheduleLines) {
          page.scheduleLines = page.scheduleLines.filter(
            (sl) => sl.sourceItemId !== msId
          );
        }
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updateLaneHeight: (pageId, laneId, heightPx) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        const newHeight = Math.max(40, heightPx);
        lane.heightPx = newHeight;
        // Clamp bars within new lane height
        for (const bar of lane.bars) {
          if (bar.heightPx > newHeight) {
            bar.heightPx = newHeight;
          }
          if (bar.yOffsetInLane + bar.heightPx > newHeight) {
            bar.yOffsetInLane = Math.max(0, newHeight - bar.heightPx);
          }
        }
        // Clamp milestones within new lane height
        const msDisplayHeight = 16;
        for (const ms of lane.milestones) {
          if (ms.yOffsetInLane + msDisplayHeight > newHeight) {
            ms.yOffsetInLane = Math.max(0, newHeight - msDisplayHeight);
          }
        }
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addLane: (pageId, lane) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        page.swimLanes.push(lane);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addLaneFromTemplate: (pageId, templateId) => {
    set((state) => {
      if (!state.data) return {};
      const page = state.data.pages.find((p) => p.id === pageId);
      if (!page) return {};
      // Prevent duplicate: check if lane with same registryId already exists
      if (page.swimLanes.some((l) => l.registryId === templateId)) return {};
      const tmpl = state.data.laneRegistry?.find((t) => t.id === templateId);
      if (!tmpl) return {};
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data, (draft) => {
        const draftPage = draft.pages.find((p) => p.id === pageId);
        if (!draftPage) return;
        const draftTmpl = draft.laneRegistry?.find((t) => t.id === templateId);
        if (draftTmpl && !draftTmpl.tags.includes(draftPage.name)) {
          draftTmpl.tags.push(draftPage.name);
        }
        draftPage.swimLanes.push({
          id: `lane_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          label: tmpl.label,
          heightPx: tmpl.defaultHeightPx,
          bars: [],
          milestones: [],
          tags: draftTmpl ? [...draftTmpl.tags] : [],
          registryId: tmpl.id,
        });
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  removeLane: (pageId, laneId) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        // Collect milestone IDs in this lane for schedule line cascade
        const laneObj = page.swimLanes.find((l) => l.id === laneId);
        const msIds = new Set(laneObj?.milestones.map((m) => m.id) ?? []);
        // Remove schedule name tag from template
        if (laneObj?.registryId) {
          const tmpl = draft.laneRegistry?.find((t) => t.id === laneObj.registryId);
          if (tmpl) {
            tmpl.tags = tmpl.tags.filter((t) => t !== page.name);
          }
        }
        page.swimLanes = page.swimLanes.filter((l) => l.id !== laneId);
        if (page.connections) {
          page.connections = page.connections.filter(
            (c) => c.fromLaneId !== laneId && c.toLaneId !== laneId
          );
        }
        if (page.scheduleLines) {
          page.scheduleLines = page.scheduleLines.filter(
            (sl) => sl.sourceLaneId !== laneId && !msIds.has(sl.sourceItemId)
          );
        }
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  reorderLane: (pageId, laneId, direction) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const idx = page.swimLanes.findIndex((l) => l.id === laneId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= page.swimLanes.length) return;
        [page.swimLanes[idx], page.swimLanes[swapIdx]] = [page.swimLanes[swapIdx], page.swimLanes[idx]];
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  moveLane: (pageId, laneId, newIndex) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const idx = page.swimLanes.findIndex((l) => l.id === laneId);
        if (idx < 0) return;
        const clampedIndex = Math.max(0, Math.min(page.swimLanes.length - 1, newIndex));
        if (idx === clampedIndex) return;
        const [lane] = page.swimLanes.splice(idx, 1);
        page.swimLanes.splice(clampedIndex, 0, lane);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updateLaneTags: (pageId, laneId, tags) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const lane = page.swimLanes.find((l) => l.id === laneId);
        if (!lane) return;
        lane.tags = tags;
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updateRegistryTemplate: (templateId, updates) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const tmpl = draft.laneRegistry?.find((t) => t.id === templateId);
        if (!tmpl) return;
        Object.assign(tmpl, updates);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addRegistryTemplate: (template) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        if (!draft.laneRegistry) draft.laneRegistry = [];
        draft.laneRegistry.push(template);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  removeRegistryTemplate: (templateId) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        if (!draft.laneRegistry) return;
        draft.laneRegistry = draft.laneRegistry.filter((t) => t.id !== templateId);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addPage: (name, selectedTemplateIds) => {
    set((state) => {
      if (!state.data) return {};
      const historyUpdate = pushHistory(state);
      const newPageId = `page_${Date.now()}`;
      const newData = produce(state.data, (draft) => {
        const registry = draft.laneRegistry ?? [];
        const selectedSet = new Set(selectedTemplateIds);
        const matchingTemplates = registry.filter((tmpl) => selectedSet.has(tmpl.id));
        const swimLanes: SwimLane[] = matchingTemplates.map((tmpl) => {
          // Add schedule name to template tags
          if (!tmpl.tags.includes(name)) {
            tmpl.tags.push(name);
          }
          return {
            id: `lane_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            label: tmpl.label,
            heightPx: tmpl.defaultHeightPx,
            bars: [],
            milestones: [],
            tags: [...tmpl.tags],
            registryId: tmpl.id,
          };
        });
        draft.pages.push({
          id: newPageId,
          name,
          swimLanes,
          annotations: [],
          filterTags: [],
        });
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true, currentPageId: newPageId };
    });
  },

  removePage: (pageId) => {
    set((state) => {
      if (!state.data || state.data.pages.length <= 1) return {};
      const pageName = state.data.pages.find((p) => p.id === pageId)?.name;
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data, (draft) => {
        // Remove schedule name tag from all templates
        if (pageName && draft.laneRegistry) {
          for (const tmpl of draft.laneRegistry) {
            tmpl.tags = tmpl.tags.filter((t) => t !== pageName);
          }
        }
        draft.pages = draft.pages.filter((p) => p.id !== pageId);
        draft.lastModified = new Date().toISOString();
      });
      const newCurrentPageId = pageId === state.currentPageId
        ? newData.pages[0].id
        : state.currentPageId;
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true, currentPageId: newCurrentPageId };
    });
  },

  renamePage: (pageId, name) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        const oldName = page.name;
        page.name = name;
        // Update tags in all templates: replace oldName with newName
        if (draft.laneRegistry) {
          for (const tmpl of draft.laneRegistry) {
            const idx = tmpl.tags.indexOf(oldName);
            if (idx !== -1) {
              tmpl.tags[idx] = name;
            }
          }
        }
        // Update filterTags on the page
        if (page.filterTags) {
          page.filterTags = page.filterTags.map((t) => (t === oldName ? name : t));
        }
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  reorderPage: (pageId, direction) => {
    set((state) => {
      if (!state.data) return {};
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data, (draft) => {
        const idx = draft.pages.findIndex((p) => p.id === pageId);
        if (idx < 0) return;
        const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= draft.pages.length) return;
        [draft.pages[idx], draft.pages[swapIdx]] = [draft.pages[swapIdx], draft.pages[idx]];
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  movePageToIndex: (pageId, newIndex) => {
    set((state) => {
      if (!state.data) return {};
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data, (draft) => {
        const idx = draft.pages.findIndex((p) => p.id === pageId);
        if (idx < 0) return;
        const clampedIndex = Math.max(0, Math.min(draft.pages.length - 1, newIndex));
        if (idx === clampedIndex) return;
        const [page] = draft.pages.splice(idx, 1);
        draft.pages.splice(clampedIndex, 0, page);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updatePageTimeline: (pageId, updates) => {
    set((state) => {
      if (!state.data) return {};
      const page = state.data.pages.find((p) => p.id === pageId);
      if (!page) return {};
      // Determine effective current values
      const current = page.timeline ?? state.data.timeline;
      const newStart = updates.startDate ?? current.startDate;
      const newEnd = updates.endDate ?? current.endDate;
      if (newStart >= newEnd) return {};
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data, (draft) => {
        const draftPage = draft.pages.find((p) => p.id === pageId);
        if (!draftPage) return;
        if (!draftPage.timeline) {
          const { startDate, endDate, monthWidthPx } = draft.timeline;
          draftPage.timeline = { startDate, endDate, monthWidthPx };
        }
        if (updates.startDate) draftPage.timeline.startDate = updates.startDate;
        if (updates.endDate) draftPage.timeline.endDate = updates.endDate;
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updatePageMonthWidth: (pageId, widthPx) => {
    set((state) => {
      if (!state.data) return {};
      const page = state.data.pages.find((p) => p.id === pageId);
      if (!page) return {};
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data, (draft) => {
        const draftPage = draft.pages.find((p) => p.id === pageId);
        if (!draftPage) return;
        if (!draftPage.timeline) {
          const { startDate, endDate, monthWidthPx } = draft.timeline;
          draftPage.timeline = { startDate, endDate, monthWidthPx };
        }
        draftPage.timeline.monthWidthPx = Math.max(20, Math.min(120, widthPx));
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updateMonthWidth: (widthPx) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        draft.timeline.monthWidthPx = Math.max(20, Math.min(120, widthPx));
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addConnection: (pageId, connection) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        if (!page.connections) page.connections = [];
        page.connections.push(connection);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updateConnection: (pageId, connectionId, updates) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page?.connections) return;
        const conn = page.connections.find((c) => c.id === connectionId);
        if (!conn) return;
        Object.assign(conn, updates);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  deleteConnection: (pageId, connectionId) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page?.connections) return;
        page.connections = page.connections.filter((c) => c.id !== connectionId);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  addScheduleLine: (pageId, line) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page) return;
        if (!page.scheduleLines) page.scheduleLines = [];
        page.scheduleLines.push(line);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  updateScheduleLine: (pageId, lineId, updates) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page?.scheduleLines) return;
        const line = page.scheduleLines.find((l) => l.id === lineId);
        if (!line) return;
        Object.assign(line, updates);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  deleteScheduleLine: (pageId, lineId) => {
    set((state) => {
      const historyUpdate = pushHistory(state);
      const newData = produce(state.data!, (draft) => {
        const page = draft.pages.find((p) => p.id === pageId);
        if (!page?.scheduleLines) return;
        page.scheduleLines = page.scheduleLines.filter((l) => l.id !== lineId);
        draft.lastModified = new Date().toISOString();
      });
      scheduleAutoSave(get().saveData);
      return { ...historyUpdate, data: newData, isDirty: true };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return {};
      const newIndex = state.historyIndex - 1;
      const entry = state.history[newIndex];
      scheduleAutoSave(get().saveData);
      return {
        data: JSON.parse(JSON.stringify(entry.data)),
        historyIndex: newIndex,
        isDirty: true,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return {};
      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];
      scheduleAutoSave(get().saveData);
      return {
        data: JSON.parse(JSON.stringify(entry.data)),
        historyIndex: newIndex,
        isDirty: true,
      };
    });
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { historyIndex, history } = get();
    return historyIndex < history.length - 1;
  },

  importData: (rawData: ScheduleData) => {
    const data = migrateData(rawData);
    set({
      data,
      currentPageId: data.pages[0]?.id ?? 'p0',
      isDirty: false,
      history: [{ data: JSON.parse(JSON.stringify(data)) }],
      historyIndex: 0,
    });
    // Save to server for session persistence
    get().saveData();
  },

  downloadData: async () => {
    const { data } = get();
    if (!data) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const defaultName = `schedule_${yyyy}${mm}${dd}.json`;
    const json = JSON.stringify(data, null, 2);

    // File System Access API が使える場合: ネイティブ保存ダイアログ
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultName,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return; // ユーザーがキャンセル
      }
    }

    // フォールバック: 従来の <a> ダウンロード
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
  },
}));
