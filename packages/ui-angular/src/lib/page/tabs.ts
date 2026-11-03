import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  effect,
  inject,
  input,
  model,
  TemplateRef,
} from '@angular/core';
import { Tab as AriaTab, TabContent, TabList, TabPanel, Tabs as AriaTabs } from '@angular/aria/tabs';

/**
 * One tab of a Tabs: its label and, inside the template, its content (rendered when chosen).
 * When `os-tab` has no value (`<ng-template os-tab label="Install">`), the label is used as the
 * tab's value.
 */
@Directive({ selector: 'ng-template[os-tab]' })
export class Tab {
  readonly osTab = input('', { alias: 'os-tab' });
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  readonly value = computed(() => this.osTab().trim() || this.label());
}

/**
 * Tabs that switch between views in one place. Arrow keys move between tabs and show them,
 * Home and End jump to the ends (from @angular/aria).
 *
 * ```html
 * <os-tabs label="Project" [(selected)]="tab">
 *   <ng-template os-tab="overview" label="Overview">…</ng-template>
 *   <ng-template os-tab="rules" label="Rules">…</ng-template>
 * </os-tabs>
 * ```
 */
@Component({
  selector: 'os-tabs',
  imports: [AriaTab, TabContent, TabList, TabPanel, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-tabs' },
  hostDirectives: [AriaTabs],
  template: `
    <div
      ngTabList
      class="os-tab-list"
      selectionMode="follow"
      [softDisabled]="false"
      [attr.aria-label]="label()"
      [(selectedTab)]="selected"
    >
      @for (tab of tabs(); track tab.value()) {
        <button
          ngTab
          class="os-tab"
          type="button"
          [value]="tab.value()"
          [disabled]="tab.disabled()"
        >
          {{ tab.label() }}
        </button>
      }
    </div>
    @for (tab of tabs(); track tab.value()) {
      <div ngTabPanel class="os-tab-panel" [value]="tab.value()">
        <ng-template ngTabContent>
          <ng-container [ngTemplateOutlet]="tab.template" />
        </ng-template>
      </div>
    }
  `,
})
export class Tabs {
  /** Names the tab list for screen readers. */
  readonly label = input.required<string>();
  /** The chosen tab's value. Defaults to the first tab. */
  readonly selected = model<string>();
  protected readonly tabs = contentChildren(Tab);

  constructor() {
    effect(() => {
      const seen = new Set<string>();
      for (const tab of this.tabs()) {
        const value = tab.value();
        if (seen.has(value)) {
          throw new Error(`Duplicate os-tab value "${value}". Give each tab a distinct value.`);
        }
        seen.add(value);
      }
      if (this.selected() === undefined) {
        this.selected.set(this.tabs().find((tab) => !tab.disabled())?.value());
      }
    });
  }
}
