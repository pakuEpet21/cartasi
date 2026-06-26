import { useMemo } from "react";
import { useMenuFilters } from "../store";
import type { MenuItem } from "../types";

export function useFilteredMenu(items: MenuItem[]): MenuItem[] {
  const { query, categoryId, excludeAllergens } = useMenuFilters();
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryId && item.category_id !== categoryId) return false;
      if (excludeAllergens.length > 0 && item.allergens.some((a) => excludeAllergens.includes(a)))
        return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, query, categoryId, excludeAllergens]);
}