import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  Button,
  Control,
  Field,
  Icon,
  Popover,
  PopoverTrigger,
  SegmentedControl,
  type SegmentOption,
} from '@openstuff-dev/ui-angular';
import { ChevronDown } from 'lucide';
import { DEFAULT_PRIMARY, PRESETS, type Scheme, ThemeService } from './theme';

/** The theme button in the top bar: light or dark, and the primary colour. */
@Component({
  selector: 'docs-theme-picker',
  imports: [Button, Control, Field, Icon, Popover, PopoverTrigger, SegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './theme-picker.css',
  template: `
    <button os-button type="button" size="sm" [os-popover-trigger]="picker">
      <span class="swatch" aria-hidden="true"></span>
      Theme
      <svg os-icon size="sm" [icon]="chevron"></svg>
    </button>
    <div os-popover #picker="osPopover" align="end" aria-label="Theme" class="picker">
      <os-segmented-control
        label="Colour scheme"
        size="sm"
        [options]="schemes"
        [(value)]="theme.scheme"
      />
      <div class="presets" role="group" aria-label="Primary colour presets">
        @for (preset of presets; track preset.value) {
          <button
            type="button"
            class="preset"
            [style.background]="preset.value"
            [attr.aria-label]="preset.label"
            [attr.aria-pressed]="theme.primary() === preset.value"
            (click)="theme.setPrimary(preset.value)"
          ></button>
        }
      </div>
      <div class="custom">
        <input
          type="color"
          class="color-input"
          aria-label="Pick a primary colour"
          [value]="theme.primary()"
          (input)="theme.setPrimary(value($event))"
        />
        <os-field label="Primary colour" hint="Any hex colour. The whole theme follows it.">
          <input
            os-input
            size="sm"
            spellcheck="false"
            autocomplete="off"
            [value]="theme.primary()"
            (change)="theme.setPrimary(value($event))"
          />
        </os-field>
      </div>
      @if (theme.primary() !== defaultPrimary) {
        <button os-button type="button" size="sm" variant="link" (click)="reset()">
          Back to the default blue
        </button>
      }
    </div>
  `,
})
export class ThemePicker {
  protected readonly theme = inject(ThemeService);
  protected readonly chevron = ChevronDown;
  protected readonly presets = PRESETS;
  protected readonly defaultPrimary = DEFAULT_PRIMARY;
  protected readonly schemes: SegmentOption<Scheme>[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value.trim();
  }

  protected reset(): void {
    this.theme.setPrimary(DEFAULT_PRIMARY);
  }
}
