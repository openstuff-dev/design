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
import type { IconNode } from '@openstuff-dev/ui';
import { Icon } from '../icon/icon';

/**
 * One tab of a Tabs: its label, optional icon and count, and inside the template its content
 * (rendered when chosen). When `os-tab` has no value (`<ng-template os-tab label="Install">`),
 * the label is used as the tab's value.
 */
@Directive({ selector: 'ng-template[os-tab]' })
export class Tab {
  readonly osTab = input('', { alias: 'os-tab' });
  readonly label = input.required<string>();
  readonly icon = input<IconNode>();
  readonly count = input<number | null>(null);
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
 *   <ng-template os-tab="rules" label="Rules" [count]="12">…</ng-template>
 * </os-tabs>
 * ```
 */
@Component({
  selector: 'os-tabs',
  imports: [AriaTab, Icon, TabContent, TabList, TabPanel, NgTemplateOutlet],
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
      [attr.data-sticky]="sticky() ? '' : null"
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
          @if (tab.icon(); as icon) {
            <svg os-icon size="sm" [icon]="icon"></svg>
          }
          {{ tab.label() }}
          @if (tab.count() !== null) {
            <span class="os-tab-count">{{ tab.count() }}</span>
          }
        </button>
      }
    </div>
    @for (tab of tabs(); track tab.value()) {
      <div
        ngTabPanel
        class="os-tab-panel"
        [attr.data-boxed]="boxed() ? '' : null"
        [value]="tab.value()"
      >
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
  /** Stick the tab bar under the app shell's topbar while scrolling. */
  readonly sticky = input(false, { transform: booleanAttribute });
  /** Frame each tab panel as a bordered surface card. */
  readonly boxed = input(false, { transform: booleanAttribute });
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

/**
 * A horizontal sub-menu of router or anchor links styled as tabs (OpenPurpose's page sub-menu).
 * Sticks below the shell topbar by default.
 *
 * ```html
 * <nav os-tab-nav label="Project sections">
 *   <a os-tab-link [routerLink]="[]" [queryParams]="{ tab: null }" [icon]="FileText" [count]="4"
 *      [attr.aria-current]="current() === 'docs' ? 'page' : null">Documents</a>
 * </nav>
 * ```
 */
@Directive({
  selector: 'nav[os-tab-nav]',
  host: {
    class: 'os-tab-list',
    '[attr.aria-label]': 'label()',
    '[attr.data-sticky]': 'sticky() ? "" : null',
  },
})
export class TabNav {
  readonly label = input.required<string>();
  /** Stick under the shell topbar while scrolling (true by default). */
  readonly sticky = input(true, { transform: booleanAttribute });
}

/**
 * One link inside `nav[os-tab-nav]`, with an optional icon and count pill. Mark the active link
 * with `aria-current="page"` (or Angular's `routerLinkActive ariaCurrentWhenActive="page"`).
 */
@Component({
  selector: 'a[os-tab-link], button[os-tab-link]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-tab' },
  template: `
    @if (icon(); as icon) {
      <svg os-icon size="sm" [icon]="icon"></svg>
    }
    <ng-content />
    @if (count() !== null) {
      <span class="os-tab-count">{{ count() }}</span>
    }
  `,
})
export class TabLink {
  readonly icon = input<IconNode>();
  readonly count = input<number | null>(null);
}
