import type { ThemeTokens } from "./types";

const COLOR_VAR_MAP: Record<keyof NonNullable<ThemeTokens["colors"]>, string> = {
  primary: "--primary",
  primaryFg: "--primary-fg",
  accent: "--accent",
  accentFg: "--accent-fg",
  bg: "--bg",
  fg: "--fg",
  card: "--card",
  cardFg: "--card-fg",
  muted: "--muted",
  mutedFg: "--muted-fg",
  border: "--border",
};

function buildCss(theme: ThemeTokens | null | undefined): string {
  if (!theme) return "";
  const decls: string[] = [];
  if (theme.colors) {
    for (const [key, value] of Object.entries(theme.colors)) {
      const cssVar = COLOR_VAR_MAP[key as keyof typeof COLOR_VAR_MAP];
      if (cssVar && typeof value === "string") decls.push(`${cssVar}: ${value};`);
    }
  }
  if (theme.fonts?.sans)
    decls.push(`--font-sans: "${theme.fonts.sans}", ui-sans-serif, system-ui, sans-serif;`);
  if (theme.fonts?.display)
    decls.push(`--font-display: "${theme.fonts.display}", ui-serif, Georgia, serif;`);
  if (theme.radius) decls.push(`--radius: ${theme.radius};`);
  return decls.length ? `:root{${decls.join("")}}` : "";
}

/**
 * Injects per-restaurant token overrides as a <style> block (SSR-safe).
 * Used in __root.tsx so first paint already uses the brand.
 */
export function ThemeInjector({ theme }: { theme: ThemeTokens | null | undefined }) {
  const css = buildCss(theme);
  if (!css) return null;
  return <style data-theme-injector="" dangerouslySetInnerHTML={{ __html: css }} />;
}