import { create } from "zustand";

interface RowSelectStore {
  selectedRows: string[];
  setSelectedRows: (rows: string[]) => void;
}

export const useRowSelect = create<RowSelectStore>((set) => ({
  selectedRows: [],
  setSelectedRows: (rows) => set({ selectedRows: rows }),
}));
