import { Search } from "lucide-react";
import { useMenuFilters } from "../store";

export function MenuSearch() {
  const { query, setQuery } = useMenuFilters();
  return (
    <label className="flex w-full items-center gap-2 rounded-[var(--radius)] border border-border bg-card px-3 py-2 shadow-[var(--shadow-soft)] focus-within:border-primary">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar en la carta…"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}