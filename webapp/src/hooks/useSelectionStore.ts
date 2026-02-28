import { create } from 'zustand';

export interface SelectedItem {
  type: 'bar' | 'milestone' | 'lane';
  id: string;
  laneId: string;
}

interface SelectionState {
  selected: SelectedItem[];
  select: (item: SelectedItem, multi?: boolean) => void;
  deselect: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selected: [],

  select: (item, multi = false) => {
    set((state) => {
      // Lane selection is exclusive — clear other types
      if (item.type === 'lane') {
        return { selected: [item] };
      }
      // Selecting bar/milestone clears any lane selection
      const filtered = state.selected.filter((s) => s.type !== 'lane');
      if (multi) {
        const exists = filtered.find((s) => s.id === item.id);
        if (exists) {
          return { selected: filtered.filter((s) => s.id !== item.id) };
        }
        return { selected: [...filtered, item] };
      }
      return { selected: [item] };
    });
  },

  deselect: (id) => {
    set((state) => ({ selected: state.selected.filter((s) => s.id !== id) }));
  },

  clearSelection: () => set({ selected: [] }),

  isSelected: (id) => get().selected.some((s) => s.id === id),
}));
