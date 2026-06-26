import { useMenuFilters } from "../store";
import type { Category } from "../types";
import { cn } from "@/lib/utils";

export function CategoryTabs({ categories }: { categories: Category[] }) {
  const { categoryId, setCategoryId } = useMenuFilters();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategoryId(null)}
        className={cn(
          "rounded-full border px-4 py-1.5 text-sm transition-colors",
          categoryId === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:bg-muted",
        )}
      >
        Todo
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setCategoryId(c.id)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            categoryId === c.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}