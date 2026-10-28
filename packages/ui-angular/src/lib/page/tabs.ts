import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
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
 */
@Directive({ selector: 'ng-template[os-tab]' })
export class Tab {
  readonly value = input.required<string>({ alias: 'os-tab' });
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
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
      if (this.selected() === undefined) {
        this.selected.set(this.tabs().find((tab) => !tab.disabled())?.value());
      }
    });
  }
}
