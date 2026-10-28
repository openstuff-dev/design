import {
  clampChroma,
  modeHsl,
  modeLab,
  modeLch,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  useMode,
  wcagContrast,
  type Oklch,
} from 'culori/fn';

// Only the colour spaces CSS authors write in, so runtime theming stays small.
for (const mode of [modeRgb, modeLrgb, modeHsl, modeLab, modeLch, modeOklab, modeOklch]) {
  useMode(mode);
}
const toOklch = useMode(modeOklch);

export type { Oklch };

/** Reads any CSS colour (`#2d5bff`, `rgb(…)`, `oklch(…)`, …) as OKLCH. */
export function parseColor(input: string): Oklch {
  const parsed = parse(input);
  if (!parsed) {
    throw new Error(
      `Couldn't read the colour "${input}". Use a CSS colour such as #2d5bff or oklch(0.6 0.2 260).`,
    );
  }
  const { l, c, h } = toOklch(parsed);
  return { mode: 'oklch', l, c, h: h ?? 0 };
}

/**
 * Makes an sRGB-displayable OKLCH colour, rounded the way it is written out
 * (`oklch(0.99 0.004 160)`), so contrast is measured on the exact output.
 */
export function oklch(l: number, c: number, h: number, alpha = 1): Oklch {
  const inGamut = clampChroma(
    { mode: 'oklch', l: clamp(l, 0, 1), c: Math.max(c, 0), h },
    'oklch',
    'rgb',
  );
  const chroma = Math.floor(inGamut.c * 1000) / 1000;
  return {
    mode: 'oklch',
    l: round(inGamut.l, 3),
    c: chroma,
    h: chroma === 0 ? 0 : round(h, 1),
    ...(alpha < 1 && { alpha: round(alpha, 2) }),
  };
}

export function formatColor({ l, c, h = 0, alpha }: Oklch): string {
  const value = `${String(round(l, 3))} ${String(round(c, 3))} ${String(round(h, 1))}`;
  return alpha === undefined || alpha >= 1
    ? `oklch(${value})`
    : `oklch(${value} / ${String(round(alpha, 2))})`;
}

export function contrast(a: Oklch, b: Oklch): number {
  return wcagContrast(a, b);
}

/**
 * Moves a colour's lightness until it reaches `ratio` against every background,
 * keeping its hue and asked-for chroma. Darker in the light scheme, lighter in the dark one.
 */
export function ensureContrast(
  color: Oklch,
  backgrounds: readonly Oklch[],
  ratio: number,
  direction: 'darker' | 'lighter',
  chroma = color.c,
): Oklch {
  const step = direction === 'darker' ? -0.005 : 0.005;
  let current = color;
  let l = color.l;
  while (backgrounds.some((bg) => contrast(current, bg) < ratio) && l > 0 && l < 1) {
    l = clamp(l + step, 0, 1);
    current = oklch(l, chroma, color.h ?? 0);
  }
  return current;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
