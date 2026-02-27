import { create } from 'zustand';

export interface SelectedItem {
  type: 'bar' | 'milestone';
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
        const exists = state.selected.find((s) => s.id === item.id);
        if (exists) {
          return { selected: state.selected.filter((s) => s.id !== item.id) };
        }
        return { selected: [...state.selected, item] };
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
