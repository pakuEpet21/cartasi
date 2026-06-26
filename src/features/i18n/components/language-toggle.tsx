import { Languages } from "lucide-react";
import { useLocale } from "../store";
import { LOCALES } from "../dict";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];
  return (
    <button
      onClick={() => setLocale(next)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-wide text-foreground/80 hover:bg-muted"
      aria-label={`Cambiar idioma a ${next.toUpperCase()}`}
    >
      <Languages className="h-3.5 w-3.5" />
      {locale.toUpperCase()}
    </button>
  );
}