import { create } from "zustand";

type MenuFiltersState = {
  query: string;
  categoryId: string | null;
  excludeAllergens: string[];
  setQuery: (q: string) => void;
  setCategoryId: (id: string | null) => void;
  toggleAllergen: (a: string) => void;
  clear: () => void;
};

export const useMenuFilters = create<MenuFiltersState>((set) => ({
  query: "",
  categoryId: null,
  excludeAllergens: [],
  setQuery: (query) => set({ query }),
  setCategoryId: (categoryId) => set({ categoryId }),
  toggleAllergen: (a) =>
    set((s) => ({
      excludeAllergens: s.excludeAllergens.includes(a)
        ? s.excludeAllergens.filter((x) => x !== a)
        : [...s.excludeAllergens, a],
    })),
  clear: () => set({ query: "", categoryId: null, excludeAllergens: [] }),
}));