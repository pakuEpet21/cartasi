import type { FeatureFlags } from "./types";

/**
 * Default flag values used when the DB row is missing or a flag wasn't set yet.
 * Keep this list in sync with `FlagName`.
 */
export const DEFAULT_FLAGS: FeatureFlags = {
  chatbot: false,
  cart: false,
  minigame: false,
  reservations: false,
  loyaltyProgram: false,
  menuFilters: true,
  allergenInfo: true,
  calorieInfo: false,
  multiLanguage: false,
  qrMenu: false,
  tableOrdering: false,
  deliveryTracking: false,
  reviews: false,
  gallery: true,
  socialLinks: true,
  whatsappOrder: false,
  openingHours: true,
  promotions: false,
  staffPicker: false,
  adminPanel: true,
  productImages: true,
  banner: true,
  search: true,
};

export function resolveFlags(raw: Partial<FeatureFlags> | null | undefined): FeatureFlags {
  return { ...DEFAULT_FLAGS, ...(raw ?? {}) };
}