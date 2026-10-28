import type { ColorPair, ShadowLayer, Theme } from './theme.js';

export const PREFIX = 'os';

export function lightDark({ light, dark }: ColorPair): string {
  return `light-dark(${light}, ${dark})`;
}

/** `light-dark()` only takes colours, so it goes on each layer's colour, not the whole shadow. */
export function shadowCss(layers: readonly ShadowLayer[]): string {
  return layers
    .map(({ x, y, blur, spread, color }) => `${x} ${y} ${blur} ${spread} ${lightDark(color)}`)
    .join(', ');
}

export function propertyName(name: string): `--os-${string}` {
  return `--${PREFIX}-${name}`;
}

/**
 * Every token as a custom property, e.g. `{ '--os-bg-default': 'light-dark(…)' }`.
 * Set them on an element to give that subtree its own primary colour.
 */
export function cssProperties(theme: Theme): Record<`--os-${string}`, string> {
  const properties: Record<`--os-${string}`, string> = {};
  for (const [name, pair] of Object.entries(theme.colors)) {
    properties[propertyName(name)] = lightDark(pair);
  }
  for (const [name, layers] of Object.entries(theme.shadows)) {
    properties[propertyName(`shadow-${name}`)] = shadowCss(layers);
  }
  for (const [name, value] of Object.entries(theme.values)) {
    properties[propertyName(name)] = value;
  }
  return properties;
}

/**
 * Applies a theme to one element and everything inside it.
 *
 * @example applyTheme(card, generateTheme(organization.color))
 */
export function applyTheme(
  element: { style: { setProperty(name: string, value: string): void } },
  theme: Theme,
): void {
  for (const [name, value] of Object.entries(cssProperties(theme))) {
    element.style.setProperty(name, value);
  }
}
