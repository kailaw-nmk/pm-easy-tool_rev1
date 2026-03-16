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
      if (multi) {
        // Multi-select: only allow same type (lane with lane, bar/milestone together)
        const sameTypeFilter = item.type === 'lane'
          ? state.selected.filter((s) => s.type === 'lane')
          : state.selected.filter((s) => s.type !== 'lane');
        const exists = sameTypeFilter.find((s) => s.id === item.id);
        if (exists) {
          return { selected: sameTypeFilter.filter((s) => s.id !== item.id) };
        }
        return { selected: [...sameTypeFilter, item] };
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
