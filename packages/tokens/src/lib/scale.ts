import { clamp, ensureContrast, oklch, type Oklch } from './color.js';

export type Scheme = 'light' | 'dark';

/**
 * 12 steps, Radix-style: 1–2 app backgrounds, 3–5 component backgrounds,
 * 6–8 borders, 9–10 solid fills, 11–12 text. Index 0 is step 1.
 */
export type Scale = readonly Oklch[];

type Steps = readonly [number, number, number, number, number, number,
  number, number, number, number, number, number];

// Lightness per step. Steps 9 and 10 of a colour scale come from the solid colour itself.
const COLOR_LIGHTNESS: Record<Scheme, Steps> = {
  light: [0.993, 0.981, 0.961, 0.94, 0.917, 0.887, 0.845, 0.78, 0, 0, 0.5, 0.27],
  dark: [0.165, 0.195, 0.235, 0.265, 0.295, 0.335, 0.385, 0.455, 0, 0, 0.8, 0.94],
};

// Chroma per step, as a share of the solid colour's chroma.
const COLOR_CHROMA: Steps = [0.06, 0.12, 0.22, 0.3, 0.38, 0.46, 0.56, 0.7, 1, 1, 0.85, 0.45];

const NEUTRAL_LIGHTNESS: Record<Scheme, Steps> = {
  light: [0.993, 0.981, 0.961, 0.94, 0.92, 0.895, 0.86, 0.8, 0.64, 0.6, 0.48, 0.21],
  dark: [0.155, 0.185, 0.22, 0.25, 0.28, 0.315, 0.36, 0.44, 0.53, 0.58, 0.76, 0.95],
};

// Chroma per step, as a share of the neutral chroma (0.005–0.015 for a colourful primary).
const NEUTRAL_CHROMA: Steps = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 1, 0.9, 0.7];

/** Dark backgrounds need a solid colour of at least this lightness to stand out. */
const MIN_DARK_SOLID = 0.5;
export const HOVER_SHIFT = 0.035;

/**
 * A colour scale whose step 9 is `solid`. Text steps (11–12) are darkened (light)
 * or lightened (dark) until they read at 4.5:1 on steps 1–3.
 */
export function colorScale(solid: Oklch, scheme: Scheme): Scale {
  const h = solid.h ?? 0;
  const lightness = COLOR_LIGHTNESS[scheme];
  const base = scheme === 'dark' ? oklch(Math.max(solid.l, MIN_DARK_SOLID), solid.c, h) : solid;
  const hover = oklch(
    clamp(base.l + (scheme === 'dark' ? HOVER_SHIFT : -HOVER_SHIFT), 0, 1),
    solid.c,
    h,
  );
  const steps = lightness.map((l, i) => {
    if (i === 8) return base;
    if (i === 9) return hover;
    return oklch(l, solid.c * COLOR_CHROMA[i], h);
  });
  return withReadableText(steps, scheme);
}

export function neutralScale(hue: number, chroma: number, scheme: Scheme): Scale {
  const steps = NEUTRAL_LIGHTNESS[scheme].map((l, i) => oklch(l, chroma * NEUTRAL_CHROMA[i], hue));
  return withReadableText(steps, scheme);
}

function withReadableText(steps: Oklch[], scheme: Scheme): Scale {
  const backgrounds = steps.slice(0, 3);
  const direction = scheme === 'light' ? 'darker' : 'lighter';
  for (const i of [10, 11]) {
    steps[i] = ensureContrast(steps[i], backgrounds, 4.5, direction);
  }
  return steps;
}
