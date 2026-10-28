import type { ColorPair, Theme } from './theme.js';

/** Where the dark value of a colour lives in DTCG files: `$value` holds the light one. */
export const DARK_EXTENSION = 'dev.openstuff.dark';

export interface DesignToken {
  $type: string;
  $value: unknown;
  $extensions?: Record<string, unknown>;
}

export interface DesignTokenGroup {
  [key: string]: DesignToken | DesignTokenGroup;
}

const VALUE_TYPES: Record<string, string> = {
  radius: 'dimension',
  space: 'dimension',
  text: 'dimension',
  font: 'fontFamily',
  leading: 'number',
  ease: 'cubicBezier',
  duration: 'duration',
  border: 'strokeStyle',
};

/**
 * The theme as a DTCG token tree (https://www.designtokens.org), grouped by the first part of
 * the name: `bg-surface-100` is `bg › surface-100`. Values are CSS strings. Colours and shadow
 * colours keep their dark value in `$extensions["dev.openstuff.dark"]`.
 */
export function toDesignTokens(theme: Theme): DesignTokenGroup {
  const tree: DesignTokenGroup = {};
  const add = (name: string, token: DesignToken) => {
    const [group, ...rest] = name.split('-');
    if (rest.length === 0) {
      tree[name] = token;
      return;
    }
    const parent = (tree[group] ??= {}) as DesignTokenGroup;
    parent[rest.join('-')] = token;
  };

  for (const [name, pair] of Object.entries(theme.colors)) {
    add(name, colorToken(pair));
  }
  for (const [name, layers] of Object.entries(theme.shadows)) {
    add(`shadow-${name}`, {
      $type: 'shadow',
      $value: layers.map(({ x, y, blur, spread, color }) => ({
        color: color.light,
        offsetX: x,
        offsetY: y,
        blur,
        spread,
      })),
      $extensions: { [DARK_EXTENSION]: layers.map(({ color }) => color.dark) },
    });
  }
  for (const [name, value] of Object.entries(theme.values)) {
    const group = name.split('-')[0];
    const type = name.startsWith('font-weight') ? 'fontWeight' : VALUE_TYPES[group];
    add(name, { $type: type, $value: value });
  }
  return tree;
}

function colorToken({ light, dark }: ColorPair): DesignToken {
  return { $type: 'color', $value: light, $extensions: { [DARK_EXTENSION]: dark } };
}
