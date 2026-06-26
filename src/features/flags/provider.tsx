import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_FLAGS } from "./defaults";
import type { FeatureFlags, FlagName } from "./types";

const FlagsContext = createContext<FeatureFlags>(DEFAULT_FLAGS);

/**
 * Applies URL overrides (`?flag.cart=1`) on top of the server-resolved flags.
 * Useful for QA / preview without DB writes.
 */
function applyUrlOverrides(base: FeatureFlags): FeatureFlags {
  if (typeof window === "undefined") return base;
  const params = new URLSearchParams(window.location.search);
  const out: FeatureFlags = { ...base };
  for (const [key, value] of params.entries()) {
    if (!key.startsWith("flag.")) continue;
    const name = key.slice(5) as FlagName;
    if (name in out) out[name] = value === "1" || value === "true";
  }
  return out;
}

export function FlagsProvider({ value, children }: { value: FeatureFlags; children: ReactNode }) {
  const flags = useMemo(() => applyUrlOverrides(value), [value]);
  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;
}

export function useFlagsContext() {
  return useContext(FlagsContext);
}