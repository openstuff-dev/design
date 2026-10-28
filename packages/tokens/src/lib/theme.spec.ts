import { contrast, parseColor } from './color.js';
import { cssProperties } from './css.js';
import { toDesignTokens } from './design-tokens.js';
import { generateTheme, STATUS_NAMES, type Scheme, type Theme } from './theme.js';

const PRIMARIES = {
  green: '#3ecf8e',
  blue: '#2d5bff',
  yellow: '#facc15',
  red: '#e5484d',
  'near-grey': '#6b7280',
  navy: '#1e3a8a',
  'pale yellow': '#fde68a',
};

const SURFACES = [
  'bg-default',
  'bg-alternative',
  'bg-surface-100',
  'bg-surface-200',
  'bg-surface-300',
  'bg-overlay',
  'bg-control',
  'bg-hover',
];

const ROLES = ['brand', ...STATUS_NAMES];

/** [foreground, background, minimum ratio] */
function pairs(theme: Theme): [string, string, number][] {
  const list: [string, string, number][] = [];
  for (const bg of SURFACES) {
    for (const fg of ['fg-default', 'fg-light', 'fg-lighter']) list.push([fg, bg, 4.5]);
    list.push(['fg-muted', bg, 3], ['border-control', bg, 3], ['focus-ring', bg, 3]);
    for (const role of ROLES) list.push([`${role}-text`, bg, 4.5]);
    for (const identity of theme.identity) list.push([identity, bg, 4.5]);
  }
  for (const role of ROLES) {
    list.push(
      [`${role}-ink`, `${role}-default`, 4.5],
      [`${role}-ink`, `${role}-hover`, 4.5],
      [`${role}-text`, `${role}-soft`, 4.5],
    );
  }
  for (const identity of theme.identity) list.push([identity, `${identity}-soft`, 4.5]);
  return list;
}

describe('generateTheme', () => {
  describe.each(Object.entries(PRIMARIES))('with a %s primary', (_, primary) => {
    const theme = generateTheme(primary);

    it.each<Scheme>(['light', 'dark'])('passes WCAG AA for every pair in %s', (scheme) => {
      const failures = pairs(theme)
        .map(([fg, bg, min]) => {
          const ratio = contrast(
            parseColor(theme.colors[fg][scheme]),
            parseColor(theme.colors[bg][scheme]),
          );
          return { pair: `${fg} on ${bg}`, ratio: Math.round(ratio * 100) / 100, min };
        })
        .filter(({ ratio, min }) => ratio < min);
      expect(failures).toEqual([]);
    });

    it('keeps text ordered from strongest to weakest', () => {
      for (const scheme of ['light', 'dark'] as const) {
        const bg = parseColor(theme.colors['bg-default'][scheme]);
        const ratios = ['fg-default', 'fg-light', 'fg-lighter', 'fg-muted']
          .map((name) => contrast(parseColor(theme.colors[name][scheme]), bg));
        expect(ratios).toEqual([...ratios].sort((a, b) => b - a));
      }
    });

    it('gives every role a hover that differs from its default', () => {
      for (const scheme of ['light', 'dark'] as const) {
        for (const role of ROLES) {
          expect(theme.colors[`${role}-hover`][scheme])
            .not.toBe(theme.colors[`${role}-default`][scheme]);
        }
      }
    });
  });

  it('ties the greys to the primary hue at low chroma', () => {
    const neutral = parseColor(generateTheme('#3ecf8e').colors['bg-surface-300'].light);
    expect(neutral.h).toBeCloseTo(parseColor('#3ecf8e').h ?? 0, 0);
    expect(neutral.c).toBeGreaterThan(0.003);
    expect(neutral.c).toBeLessThanOrEqual(0.015);
  });

  it('gives a yellow primary dark text and a blue one white text', () => {
    expect(parseColor(generateTheme('#facc15').colors['brand-ink'].light).l).toBeLessThan(0.3);
    expect(generateTheme('#2d5bff').colors['brand-ink'].light).toBe('oklch(1 0 0)');
  });

  it('keeps status hues fixed whatever the primary', () => {
    const fromRed = parseColor(generateTheme('#e5484d').colors['success-default'].light);
    const fromBlue = parseColor(generateTheme('#2d5bff').colors['success-default'].light);
    expect(fromRed.h).toBe(fromBlue.h);
  });

  it('spaces the identity colours evenly around the wheel', () => {
    const theme = generateTheme('#2d5bff');
    const hues = theme.identity.map((name) => parseColor(theme.colors[name].light).h ?? 0);
    const gaps = hues.slice(1).map((h, i) => (h - hues[i] + 360) % 360);
    for (const gap of gaps) expect(gap).toBeCloseTo(45, 0);
  });

  it('scales radius and sets fonts from the options', () => {
    const theme = generateTheme('#2d5bff', { radius: 0.5, fonts: { sans: 'Inter, sans-serif' } });
    expect(theme.values['radius-md']).toBe('4px');
    expect(theme.values['radius-full']).toBe('9999px');
    expect(theme.values['font-sans']).toBe('Inter, sans-serif');
  });

  it('explains a colour it can\'t read', () => {
    expect(() => generateTheme('not-a-colour')).toThrow(/Couldn't read the colour "not-a-colour"/);
  });
});

describe('cssProperties', () => {
  it('writes every colour as one light-dark() pair and shadows with pairs inside', () => {
    const properties = cssProperties(generateTheme('#2d5bff'));
    expect(properties['--os-bg-default']).toMatch(/^light-dark\(oklch\([^)]+\), oklch\([^)]+\)\)$/);
    expect(properties['--os-shadow-pop']).toMatch(
      /^0 1px 2px 0 light-dark\(.+\), 0 12px 32px -8px light-dark\(.+\)$/,
    );
    expect(properties['--os-border-style']).toBe('solid');
  });
});

describe('toDesignTokens', () => {
  it('groups by the first part of the name and keeps the dark value in $extensions', () => {
    const theme = generateTheme('#2d5bff');
    const tree = toDesignTokens(theme);
    expect(tree.bg).toMatchObject({
      'surface-100': {
        $type: 'color',
        $value: theme.colors['bg-surface-100'].light,
        $extensions: { 'dev.openstuff.dark': theme.colors['bg-surface-100'].dark },
      },
    });
    expect(tree.backdrop).toMatchObject({ $type: 'color' });
    expect(tree.font).toMatchObject({ 'weight-medium': { $type: 'fontWeight', $value: '500' } });
  });
});
