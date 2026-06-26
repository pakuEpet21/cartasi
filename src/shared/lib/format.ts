export function formatPrice(cents: number, currency = "EUR", locale = "es-ES"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

const WEEKDAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export function weekdayLabel(weekday: number): string {
  return WEEKDAYS_ES[weekday] ?? String(weekday);
}

export function formatTime(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}