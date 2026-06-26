import { useFlagsContext } from "./provider";
import type { FeatureFlags, FlagName } from "./types";

/** Returns the full flags object. Use for destructuring: `const { cart } = useFlags()`. */
export function useFlags(): FeatureFlags {
  return useFlagsContext();
}

/** Returns a single flag value. */
export function useFlag(name: FlagName): boolean {
  return useFlagsContext()[name];
}