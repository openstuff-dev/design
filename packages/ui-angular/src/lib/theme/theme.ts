import {
  ChangeDetectionStrategy,
  Component,
  type EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  input,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';
import { iconMonitor, iconMoon, iconSun } from '@openstuff-dev/ui';
import { Icon } from '../icon/icon';
import { uniqueId } from '../id';

export type ThemeChoice = 'system' | 'light' | 'dark';

/** Where the choice is stored. Set it with `provideTheme`, so each app keeps its own. */
export const THEME_STORAGE_KEY = new InjectionToken<string>('THEME_STORAGE_KEY', {
  factory: () => 'openstuff.theme',
});

/**
 * Light, dark or follow the device, stored in this browser. `data-theme` on `<html>` sets
 * `color-scheme`, which picks a side of every `light-dark()` token. With `system` the attribute
 * goes away, so the page follows the device on its own.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly key = inject(THEME_STORAGE_KEY);
  readonly choice = signal<ThemeChoice>(this.read());

  constructor() {
    this.apply(this.choice());
  }

  set(choice: ThemeChoice): void {
    try {
      if (choice === 'system') localStorage.removeItem(this.key);
      else localStorage.setItem(this.key, choice);
    } catch {
      /* Storage isn't available: the choice lasts for this tab. */
    }
    this.choice.set(choice);
    this.apply(choice);
  }

  private read(): ThemeChoice {
    try {
      const stored = localStorage.getItem(this.key);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private apply(choice: ThemeChoice): void {
    const root = document.documentElement;
    if (choice === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
  }
}

/**
 * Applies the stored theme when the app starts, on every page, and keeps it under this app's own
 * key. Apps on the same address would otherwise share one choice.
 *
 * ```ts
 * providers: [provideTheme({ storageKey: 'openrelay.theme' })]
 * ```
 */
export function provideTheme(options: { storageKey: string }): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: THEME_STORAGE_KEY, useValue: options.storageKey },
    provideEnvironmentInitializer(() => {
      inject(Theme);
    }),
  ]);
}

/**
 * The choice between system, light and dark, shown as small pictures. It's native radios, so
 * arrow keys move between the options and choose them.
 *
 * ```html
 * <os-theme-picker />
 * ```
 */
@Component({
  selector: 'os-theme-picker',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-theme-picker', role: 'radiogroup', '[attr.aria-label]': 'label()' },
  template: `
    @for (option of options; track option.value) {
      <label class="os-theme-option">
        <input
          type="radio"
          [name]="name"
          [value]="option.value"
          [checked]="theme.choice() === option.value"
          (change)="theme.set(option.value)"
        />
        <span class="os-theme-swatch" [attr.data-option]="option.value"><i></i><i></i></span>
        <span class="os-theme-option-label">
          <svg os-icon size="sm" [icon]="option.icon"></svg>
          {{ option.label }}
        </span>
      </label>
    }
  `,
})
export class ThemePicker {
  /** Names the group for screen readers. */
  readonly label = input('Theme');

  protected readonly theme = inject(Theme);
  protected readonly name = uniqueId('theme');
  protected readonly options = [
    { value: 'system', label: 'System', icon: iconMonitor },
    { value: 'light', label: 'Light', icon: iconSun },
    { value: 'dark', label: 'Dark', icon: iconMoon },
  ] as const;
}
