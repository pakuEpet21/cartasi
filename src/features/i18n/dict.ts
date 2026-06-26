export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];

export const DICT = {
  es: {
    menu: "Carta",
    contact: "Contacto",
    cart: "Carrito",
    reservations: "Reservas",
    gallery: "Galería",
    reviews: "Reseñas",
    loyalty: "Fidelidad",
    schedule: "Horario",
    closed: "Cerrado",
    follow: "Síguenos",
    search: "Buscar plato…",
    allergensExclude: "Excluir alérgenos",
    noResults: "No hay platos que coincidan con tu búsqueda.",
    staffPick: "Recomendado",
  },
  en: {
    menu: "Menu",
    contact: "Contact",
    cart: "Cart",
    reservations: "Reservations",
    gallery: "Gallery",
    reviews: "Reviews",
    loyalty: "Loyalty",
    schedule: "Hours",
    closed: "Closed",
    follow: "Follow us",
    search: "Search dish…",
    allergensExclude: "Exclude allergens",
    noResults: "No dishes match your search.",
    staffPick: "Chef's pick",
  },
} as const;

export type DictKey = keyof typeof DICT["es"];