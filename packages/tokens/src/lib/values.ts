export interface FontOptions {
  sans?: string;
  mono?: string;
}

export const DEFAULT_FONTS: Required<FontOptions> = {
  sans: '\'Geist Variable\', ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', sans-serif',
  mono: '\'Geist Mono Variable\', ui-monospace, \'SF Mono\', \'Cascadia Mono\', Consolas, monospace',
};

const RADIUS_PX = { sm: 6, md: 8, lg: 12, xl: 16 };
const SPACE_STEPS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

/**
 * Everything that isn't a colour: radius, space, type and motion. Keys are token names
 * without the `--os-` prefix.
 */
export function staticValues(fonts: FontOptions = {}, radius = 1): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [name, px] of Object.entries(RADIUS_PX)) {
    values[`radius-${name}`] = `${String(Math.round(px * radius * 100) / 100)}px`;
  }
  values['radius-full'] = '9999px';

  // 4px grid: --os-space-4 is 1rem.
  for (const step of SPACE_STEPS) {
    values[`space-${String(step)}`] = step === 0 ? '0' : `${String(step / 4)}rem`;
  }

  Object.assign(values, {
    'font-sans': fonts.sans ?? DEFAULT_FONTS.sans,
    'font-mono': fonts.mono ?? DEFAULT_FONTS.mono,
    'font-weight-regular': '400',
    'font-weight-medium': '500',
    'font-weight-semibold': '600',

    'text-xs': '0.75rem',
    'text-sm': '0.8125rem',
    'text-base': '0.875rem',
    'text-md': '1rem',
    'text-lg': '1.25rem',
    'text-xl': '1.75rem',
    'text-2xl': '2.125rem',

    'leading-tight': '1.25',
    'leading-snug': '1.4',
    'leading-normal': '1.5',
    'leading-relaxed': '1.65',

    'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
    'ease-enter': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',
    'duration-fast': '120ms',
    'duration-normal': '200ms',
    'duration-slow': '320ms',

    // Agent mode in OpenPurpose sets this to `dashed`.
    'border-style': 'solid',
  });

  return values;
}
