import {
  clamp,
  contrast,
  ensureContrast,
  formatColor,
  oklch,
  parseColor,
  type Oklch,
} from './color.js';
import { colorScale, HOVER_SHIFT, neutralScale, type Scale, type Scheme } from './scale.js';
import { staticValues, type FontOptions } from './values.js';

export type { Scheme };

export interface GenerateThemeOptions {
  /** Chroma of the greys, in OKLCH. Defaults to a tenth of the primary's, at most 0.012. */
  neutralChroma?: number;
  fonts?: FontOptions;
  /** Multiplies every radius except `full`. 0 gives square corners. */
  radius?: number;
}

/** A colour for each scheme, written as `oklch(…)`. CSS gets `light-dark(light, dark)`. */
export interface ColorPair {
  light: string;
  dark: string;
}

export interface ShadowLayer {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: ColorPair;
}

export type StatusName = 'danger' | 'warning' | 'success' | 'info';
export type ScaleName = 'brand' | 'neutral' | StatusName;

export interface Theme {
  /** The primary colour as given. */
  primary: string;
  /** The 12-step scales behind the semantic tokens, for docs and tooling. Not in the CSS. */
  scales: Record<ScaleName, Record<Scheme, string[]>>;
  /** Semantic colours by token name without the `--os-` prefix, e.g. `bg-default`. */
  colors: Record<string, ColorPair>;
  shadows: Record<string, ShadowLayer[]>;
  /** Radius, space, type and motion. */
  values: Record<string, string>;
  /** Names of the identity colours (`identity-0` … `identity-7`), e.g. one per organization. */
  identity: string[];
}

export const STATUS_NAMES: readonly StatusName[] = ['danger', 'warning', 'success', 'info'];

// Fixed hues, so a red primary doesn't turn errors green. Amber needs to be light to look amber.
const STATUS: Record<StatusName, { hue: number; lightness: number }> = {
  danger: { hue: 25, lightness: 0.6 },
  warning: { hue: 75, lightness: 0.78 },
  success: { hue: 150, lightness: 0.64 },
  info: { hue: 250, lightness: 0.6 },
};

const IDENTITY_COUNT = 8;
const SCHEMES: readonly Scheme[] = ['light', 'dark'];
const WHITE = oklch(1, 0, 0);
const BLACK = oklch(0, 0, 0);
const MAX_DARKEN_FOR_WHITE_INK = 0.08;

/**
 * Generates a complete light and dark theme from one primary colour. Every text and
 * background pair it produces passes WCAG AA (4.5:1 for text, 3:1 for control borders and
 * the focus ring) in both schemes.
 *
 * @example generateTheme('#2d5bff').colors['brand-default'] // { light: 'oklch(…)', dark: … }
 */
export function generateTheme(primary: string, options: GenerateThemeOptions = {}): Theme {
  const solid = parseColor(primary);
  const hue = solid.h ?? 0;
  const neutralChroma = options.neutralChroma ?? Math.min(solid.c * 0.1, 0.012);
  const statusChroma = clamp(solid.c, 0.12, 0.19);

  const scales: Partial<Record<ScaleName, Partial<Record<Scheme, Scale>>>> = {};
  const colors: Record<string, Partial<Record<Scheme, Oklch>>> = {};
  const set = (name: string, scheme: Scheme, color: Oklch) => {
    (colors[name] ??= {})[scheme] = color;
  };

  for (const scheme of SCHEMES) {
    const neutral = neutralScale(hue, neutralChroma, scheme);
    const brand = colorScale(solid, scheme);
    (scales.neutral ??= {})[scheme] = neutral;
    (scales.brand ??= {})[scheme] = brand;

    const surfaces = backgrounds(neutral, scheme);
    for (const [name, color] of Object.entries(surfaces)) set(name, scheme, color);
    const all = Object.values(surfaces);
    const direction = scheme === 'light' ? 'darker' : 'lighter';

    set('fg-default', scheme, ensureContrast(neutral[11], all, 4.5, direction));
    set('fg-light', scheme, ensureContrast(neutral[10], all, 4.5, direction));
    set('fg-lighter', scheme, ensureContrast(neutral[8], all, 4.5, direction));
    // Disabled text and decorative icons only: 3:1, like other non-text content.
    set('fg-muted', scheme, ensureContrast(neutral[7], all, 3, direction));

    set('border-default', scheme, neutral[5]);
    set('border-strong', scheme, neutral[7]);
    // WCAG 1.4.11: a form control's edge needs 3:1 against what's around it.
    set('border-control', scheme, ensureContrast(neutral[7], all, 3, direction));

    setColorRole('brand', brand, all, scheme, set);
    set('focus-ring', scheme, ensureContrast(brand[8], all, 3, direction));
    set('bg-selection', scheme, brand[scheme === 'light' ? 3 : 4]);

    for (const status of STATUS_NAMES) {
      const { hue: statusHue, lightness } = STATUS[status];
      const scale = colorScale(oklch(lightness, statusChroma, statusHue), scheme);
      (scales[status] ??= {})[scheme] = scale;
      setColorRole(status, scale, all, scheme, set);
    }

    // Evenly spaced hues starting at the primary, readable as text on any surface.
    const identityChroma = clamp(solid.c, 0.1, 0.16);
    for (let i = 0; i < IDENTITY_COUNT; i++) {
      const identityHue = (hue + (i * 360) / IDENTITY_COUNT) % 360;
      const soft = scheme === 'light'
        ? oklch(0.94, 0.04, identityHue)
        : oklch(0.27, 0.05, identityHue);
      const color = oklch(scheme === 'light' ? 0.55 : 0.75, identityChroma, identityHue);
      set(`identity-${String(i)}`, scheme, ensureContrast(color, [...all, soft], 4.5, direction));
      set(`identity-${String(i)}-soft`, scheme, soft);
    }

    set('backdrop', scheme, scheme === 'light'
      ? oklch(0.2, neutralChroma * 2, hue, 0.4)
      : oklch(0, 0, 0, 0.6));
  }

  const shadowColor = (light: number, dark: number): ColorPair => ({
    light: formatColor(oklch(0.25, Math.min(neutralChroma * 2, 0.03), hue, light)),
    dark: formatColor(oklch(0, 0, 0, dark)),
  });
  const layer = (x: string, y: string, blur: string, spread: string, color: ColorPair) =>
    ({ x, y, blur, spread, color });

  return {
    primary,
    scales: mapRecord(
      scales as Record<ScaleName, Partial<Record<Scheme, Scale>>>,
      (byScheme, name) => mapRecord(bothSchemes(byScheme, name), (scale) => scale.map(formatColor)),
    ),
    colors: mapRecord(colors, (pair, name) => mapRecord(bothSchemes(pair, name), formatColor)),
    shadows: {
      xs: [layer('0', '1px', '2px', '0', shadowColor(0.05, 0.3))],
      sm: [
        layer('0', '1px', '2px', '0', shadowColor(0.06, 0.35)),
        layer('0', '1px', '3px', '0', shadowColor(0.1, 0.4)),
      ],
      md: [
        layer('0', '2px', '4px', '-1px', shadowColor(0.06, 0.35)),
        layer('0', '4px', '12px', '-2px', shadowColor(0.1, 0.45)),
      ],
      pop: [
        layer('0', '1px', '2px', '0', shadowColor(0.06, 0.4)),
        layer('0', '12px', '32px', '-8px', shadowColor(0.18, 0.6)),
      ],
    },
    values: staticValues(options.fonts, options.radius),
    identity: Array.from({ length: IDENTITY_COUNT }, (_, i) => `identity-${String(i)}`),
  };
}

/**
 * Light: the page is near white, cards are white and recessed areas get darker.
 * Dark: surfaces get lighter as they rise.
 */
function backgrounds(neutral: Scale, scheme: Scheme): Record<string, Oklch> {
  if (scheme === 'light') {
    return {
      'bg-default': neutral[0],
      'bg-alternative': neutral[1],
      'bg-surface-100': WHITE,
      'bg-surface-200': neutral[1],
      'bg-surface-300': neutral[2],
      'bg-overlay': WHITE,
      'bg-control': neutral[1],
      'bg-hover': neutral[2],
    };
  }
  const page = neutral[0];
  return {
    'bg-default': page,
    'bg-alternative': oklch(page.l - 0.02, page.c, page.h ?? 0),
    'bg-surface-100': neutral[1],
    'bg-surface-200': neutral[2],
    'bg-surface-300': neutral[3],
    'bg-overlay': neutral[2],
    'bg-control': neutral[2],
    'bg-hover': neutral[3],
  };
}

/** `<role>-default/-hover/-ink/-soft/-border/-text` from a colour scale. */
function setColorRole(
  role: string,
  scale: Scale,
  surfaces: readonly Oklch[],
  scheme: Scheme,
  set: (name: string, scheme: Scheme, color: Oklch) => void,
): void {
  const soft = scale[2];
  let solid = scale[8];

  // White text, darkening the solid a little if that's all it takes (a mid red or blue).
  // Light solids (yellow, amber) get near-black text instead, or black as a last resort.
  const darkened = ensureContrast(solid, [WHITE], 4.5, 'darker');
  const darkInk = [oklch(0.2, Math.min(solid.c * 0.1, 0.02), solid.h ?? 0), BLACK]
    .find((candidate) => contrast(candidate, solid) >= 4.5);
  let ink = WHITE;
  if (solid.l - darkened.l <= MAX_DARKEN_FOR_WHITE_INK || !darkInk) {
    solid = darkened;
  } else {
    ink = darkInk;
  }
  // Hover moves away from the ink, so the label only gets easier to read.
  const hoverShift = ink === WHITE ? -HOVER_SHIFT : HOVER_SHIFT;
  const hover = oklch(clamp(solid.l + hoverShift, 0, 1), scale[9].c, solid.h ?? 0);

  const direction = scheme === 'light' ? 'darker' : 'lighter';
  set(`${role}-default`, scheme, solid);
  set(`${role}-hover`, scheme, hover);
  set(`${role}-ink`, scheme, ink);
  set(`${role}-soft`, scheme, soft);
  set(`${role}-border`, scheme, scale[6]);
  set(`${role}-text`, scheme, ensureContrast(scale[10], [...surfaces, soft], 4.5, direction));
}

function bothSchemes<T>(value: Partial<Record<Scheme, T>>, name: string): Record<Scheme, T> {
  const { light, dark } = value;
  if (light === undefined || dark === undefined) throw new Error(`${name} is missing a scheme.`);
  return { light, dark };
}

function mapRecord<K extends string, V, R>(
  record: Record<K, V>,
  fn: (value: V, key: K) => R,
): Record<K, R> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, fn(value as V, key as K)]),
  ) as Record<K, R>;
}
