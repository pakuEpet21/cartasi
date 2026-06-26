import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./dict";

type State = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

export const useLocale = create<State>()(
  persist(
    (set) => ({ locale: "es", setLocale: (locale) => set({ locale }) }),
    { name: "lbt-locale" },
  ),
);

import { DICT, type DictKey } from "./dict";
export function useT(): (k: DictKey) => string {
  const locale = useLocale((s) => s.locale);
  return (k) => DICT[locale][k];
}