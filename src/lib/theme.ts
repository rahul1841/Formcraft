import type { CSSProperties } from "react";
import { FONT_SIZE_SCALE, SPACING_SCALE } from "@/lib/constants";
import { mix, readableTextOn, rgba } from "@/lib/utils";
import type { FormTheme } from "@/lib/types";

/**
 * Maps a form's theme onto the CSS custom properties consumed by the
 * `.ncf-*` classes in globals.css. One place decides how a theme looks, so the
 * builder preview and the public form can never drift apart.
 */
export function themeToCssVars(theme: FormTheme): CSSProperties {
  const primaryContrast = readableTextOn(theme.primaryColor);
  const darkSurface = readableTextOn(theme.cardBackground) === "#ffffff";

  return {
    "--ncf-primary": theme.primaryColor,
    "--ncf-primary-contrast": primaryContrast,
    "--ncf-primary-soft": rgba(theme.primaryColor, 0.12),
    "--ncf-primary-ring": rgba(theme.primaryColor, 0.28),
    "--ncf-primary-hover": darkSurface
      ? mix(theme.primaryColor, "#ffffff", 0.12)
      : mix(theme.primaryColor, "#000000", 0.12),
    "--ncf-bg": theme.backgroundColor,
    "--ncf-card": theme.cardBackground,
    "--ncf-text": theme.textColor,
    "--ncf-muted": theme.mutedTextColor,
    "--ncf-border": theme.borderColor,
    "--ncf-input-bg": darkSurface
      ? rgba("#ffffff", 0.06)
      : mix(theme.cardBackground, "#000000", 0.03),
    "--ncf-font": theme.fontFamily,
    "--ncf-font-size": `${FONT_SIZE_SCALE[theme.fontSize]}px`,
    "--ncf-radius": `${theme.borderRadius}px`,
    "--ncf-radius-sm": `${Math.max(4, Math.round(theme.borderRadius * 0.6))}px`,
    "--ncf-gap": `${SPACING_SCALE[theme.spacing]}px`,
    "--ncf-max-width": `${theme.maxWidth}px`,
    "--ncf-label-align": theme.labelAlign,
    "--ncf-danger": darkSurface ? "#fca5a5" : "#dc2626",
  } as CSSProperties;
}

/** Decorative page background behind the form card. */
export function backgroundStyle(theme: FormTheme): CSSProperties {
  const base: CSSProperties = { background: theme.backgroundColor };
  switch (theme.backgroundPattern) {
    case "dots":
      return {
        ...base,
        backgroundImage: `radial-gradient(${rgba(theme.primaryColor, 0.18)} 1px, transparent 1px)`,
        backgroundSize: "18px 18px",
      };
    case "grid":
      return {
        ...base,
        backgroundImage: `linear-gradient(${rgba(theme.primaryColor, 0.1)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(theme.primaryColor, 0.1)} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      };
    case "gradient":
      return {
        background: `linear-gradient(160deg, ${rgba(theme.primaryColor, 0.16)} 0%, ${theme.backgroundColor} 45%, ${rgba(theme.primaryColor, 0.08)} 100%)`,
      };
    default:
      return base;
  }
}

export const FIELD_WIDTH_CLASS: Record<string, string> = {
  full: "ncf-col-full",
  half: "ncf-col-half",
  third: "ncf-col-third",
};
