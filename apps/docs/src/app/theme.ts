import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { applyTheme, generateTheme, type Theme } from '@openstuff-dev/tokens';

export type Scheme = 'system' | 'light' | 'dark';

export const DEFAULT_PRIMARY = '#2d5bff';

/** Primary colours to try, each with a different hue and lightness. */
export const PRESETS = [
  { label: 'Blue', value: DEFAULT_PRIMARY },
  { label: 'Green', value: '#3ecf8e' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#facc15' },
] as const;

const STORAGE_KEY = 'openstuff-docs-theme';
const HEX = /^#[0-9a-f]{6}$/i;

interface Saved {
  scheme?: Scheme;
  primary?: string;
}

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved;
  } catch {
    return {};
  }
}

/**
 * The light/dark choice and primary colour of the whole site. The primary colour runs through
 * `generateTheme` in the browser, exactly as `os-tokens` does at build time.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly saved = load();

  readonly scheme = signal<Scheme>(this.saved.scheme ?? 'system');
  readonly primary = signal(
    this.saved.primary && HEX.test(this.saved.primary) ? this.saved.primary : DEFAULT_PRIMARY,
  );

  /** The generated theme, for the colour pages. */
  readonly theme = signal<Theme>(generateTheme(this.primary()));

  constructor() {
    effect(() => {
      const scheme = this.scheme();
      if (scheme === 'system') delete this.root.dataset['theme'];
      else this.root.dataset['theme'] = scheme;
    });
    effect(() => {
      const theme = generateTheme(this.primary());
      this.theme.set(theme);
      applyTheme(this.root, theme);
    });
    effect(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ scheme: this.scheme(), primary: this.primary() }),
        );
      } catch {
        // Private windows and blocked storage: the choice lasts until the page closes.
      }
    });
  }

  setPrimary(value: string): void {
    if (HEX.test(value)) this.primary.set(value.toLowerCase());
  }
}
