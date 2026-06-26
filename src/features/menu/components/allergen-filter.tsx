import { useMenuFilters } from "../store";
import { ALLERGEN_LABELS, type Allergen } from "../types";
import { cn } from "@/lib/utils";

const COMMON: Allergen[] = ["gluten", "lactose", "nuts", "egg", "fish", "shellfish"];

export function AllergenFilter() {
  const { excludeAllergens, toggleAllergen } = useMenuFilters();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">Excluir:</span>
      {COMMON.map((a) => {
        const active = excludeAllergens.includes(a);
        return (
          <button
            key={a}
            onClick={() => toggleAllergen(a)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            sin {ALLERGEN_LABELS[a].toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}