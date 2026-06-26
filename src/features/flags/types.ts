/**
 * Feature flag system.
 *
 * Add a flag here, give it a default in `defaults.ts`, and use it via
 * `useFlags()` or `<IfFlag name="...">`. Code that gates on a flag must
 * import only from `@/features/flags` (the barrel).
 */
export type FlagName =
  | "chatbot"
  | "cart"
  | "minigame"
  | "reservations"
  | "loyaltyProgram"
  | "menuFilters"
  | "allergenInfo"
  | "calorieInfo"
  | "multiLanguage"
  | "qrMenu"
  | "tableOrdering"
  | "deliveryTracking"
  | "reviews"
  | "gallery"
  | "socialLinks"
  | "whatsappOrder"
  | "openingHours"
  | "promotions"
  | "staffPicker"
  | "adminPanel"
  | "productImages"
  | "banner"
  | "search";

export type FeatureFlags = Record<FlagName, boolean>;