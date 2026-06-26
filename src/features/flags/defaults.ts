import type { FeatureFlags } from "./types";

/**
 * Default flag values used when the DB row is missing or a flag wasn't set yet.
 * Keep this list in sync with `FlagName`.
 */
export const DEFAULT_FLAGS: FeatureFlags = {
  // All flags default to ON so the template ships every module visible.
  // Disable from the admin (or per-restaurant DB row) to remove a feature.
  chatbot: true,
  cart: true,
  minigame: false, // requiere diseño de juego dedicado
  reservations: true,
  loyaltyProgram: true,
  menuFilters: true,
  allergenInfo: true,
  calorieInfo: true,
  multiLanguage: true,
  qrMenu: true,
  tableOrdering: false, // requiere integración POS
  deliveryTracking: false, // requiere integración carrier
  reviews: true,
  gallery: true,
  socialLinks: true,
  whatsappOrder: true,
  openingHours: true,
  promotions: true,
  staffPicker: true,
  adminPanel: true,
  productImages: true,
  banner: true,
  search: true,
};

export function resolveFlags(raw: Partial<FeatureFlags> | null | undefined): FeatureFlags {
  return { ...DEFAULT_FLAGS, ...(raw ?? {}) };
}