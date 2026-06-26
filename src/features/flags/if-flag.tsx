import type { ReactNode } from "react";
import { useFlag } from "./use-flags";
import type { FlagName } from "./types";

/**
 * Renders children only when the flag is enabled. Use `fallback` for the
 * opposite branch. Heavy features should be wrapped in React.lazy outside
 * this component so the bundle ships only when enabled.
 */
export function IfFlag({
  name,
  fallback = null,
  children,
}: {
  name: FlagName;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return <>{useFlag(name) ? children : fallback}</>;
}