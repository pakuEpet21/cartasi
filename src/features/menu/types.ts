export type Allergen =
  | "gluten" | "lactose" | "nuts" | "egg" | "fish" | "shellfish" | "soy"
  | "sesame" | "celery" | "mustard" | "sulphites" | "lupin" | "molluscs" | "peanuts";

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: "Gluten", lactose: "Lácteos", nuts: "Frutos secos", egg: "Huevo",
  fish: "Pescado", shellfish: "Crustáceos", soy: "Soja", sesame: "Sésamo",
  celery: "Apio", mustard: "Mostaza", sulphites: "Sulfitos", lupin: "Altramuces",
  molluscs: "Moluscos", peanuts: "Cacahuetes",
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  position: number;
  allergens: Allergen[];
  calories: number | null;
  tags: string[];
};

export type Promotion = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
};

export type OpeningHour = {
  weekday: number;
  opens: string | null;
  closes: string | null;
  is_closed: boolean;
};

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
};