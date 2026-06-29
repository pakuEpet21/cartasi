/**
 * Static restaurant data - hours and social links.
 * These were moved from the database to simplify the schema.
 * Edit this file to update restaurant contact info.
 */

export type StaticOpeningHour = {
  weekday: number;
  opens: string | null;
  closes: string | null;
  is_closed: boolean;
};

export type StaticSocialLink = {
  id: string;
  platform: string;
  url: string;
};

// Example static data - customize for your restaurant
export const STATIC_OPENING_HOURS: StaticOpeningHour[] = [
  { weekday: 1, opens: "12:00", closes: "16:00", is_closed: false },
  { weekday: 1, opens: "19:00", closes: "23:00", is_closed: false },
  { weekday: 2, opens: "12:00", closes: "16:00", is_closed: false },
  { weekday: 2, opens: "19:00", closes: "23:00", is_closed: false },
  { weekday: 3, opens: "12:00", closes: "16:00", is_closed: false },
  { weekday: 3, opens: "19:00", closes: "23:00", is_closed: false },
  { weekday: 4, opens: "12:00", closes: "16:00", is_closed: false },
  { weekday: 4, opens: "19:00", closes: "23:00", is_closed: false },
  { weekday: 5, opens: "12:00", closes: "16:00", is_closed: false },
  { weekday: 5, opens: "19:00", closes: "00:00", is_closed: false },
  { weekday: 6, opens: "12:00", closes: "16:00", is_closed: false },
  { weekday: 6, opens: "19:00", closes: "00:00", is_closed: false },
  { weekday: 0, opens: null, closes: null, is_closed: true },
];

export const STATIC_SOCIAL_LINKS: StaticSocialLink[] = [
  { id: "instagram", platform: "Instagram", url: "https://instagram.com/labellatavola" },
  { id: "facebook", platform: "Facebook", url: "https://facebook.com/labellatavola" },
  { id: "tiktok", platform: "TikTok", url: "https://tiktok.com/@labellatavola" },
];
