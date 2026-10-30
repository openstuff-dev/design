import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';

export interface DocPage {
  path: string;
  title: string;
  group: 'Start' | 'Foundations' | 'Components';
  load: () => Promise<Type<unknown>>;
}

/** Every page, in the order the sidebar lists them. */
export const PAGES: readonly DocPage[] = [
  { path: '', title: 'Introduction', group: 'Start',
    load: () => import('./pages/home').then((m) => m.Home) },
  { path: 'getting-started', title: 'Getting started', group: 'Start',
    load: () => import('./pages/getting-started').then((m) => m.GettingStarted) },
  { path: 'browser-support', title: 'Browser support', group: 'Start',
    load: () => import('./pages/browser-support').then((m) => m.BrowserSupport) },

  { path: 'colors', title: 'Colours', group: 'Foundations',
    load: () => import('./pages/colors').then((m) => m.Colors) },
  { path: 'typography', title: 'Typography', group: 'Foundations',
    load: () => import('./pages/typography').then((m) => m.Typography) },
  { path: 'spacing', title: 'Space, radius and motion', group: 'Foundations',
    load: () => import('./pages/spacing').then((m) => m.Spacing) },
  { path: 'icons', title: 'Icons', group: 'Foundations',
    load: () => import('./pages/icons').then((m) => m.Icons) },

  { path: 'button', title: 'Button', group: 'Components',
    load: () => import('./pages/button').then((m) => m.ButtonPage) },
  { path: 'badge', title: 'Badge, chip and status dot', group: 'Components',
    load: () => import('./pages/badge').then((m) => m.BadgePage) },
  { path: 'callout', title: 'Callout', group: 'Components',
    load: () => import('./pages/callout').then((m) => m.CalloutPage) },
  { path: 'empty-state', title: 'Empty state and skeleton', group: 'Components',
    load: () => import('./pages/empty-state').then((m) => m.EmptyStatePage) },
  { path: 'field', title: 'Field and controls', group: 'Components',
    load: () => import('./pages/field').then((m) => m.FieldPage) },
  { path: 'segmented-control', title: 'Segmented control', group: 'Components',
    load: () => import('./pages/segmented').then((m) => m.SegmentedPage) },
  { path: 'dialog', title: 'Dialog and drawer', group: 'Components',
    load: () => import('./pages/dialog').then((m) => m.DialogPage) },
  { path: 'popover', title: 'Popover, menu and tooltip', group: 'Components',
    load: () => import('./pages/popover').then((m) => m.PopoverPage) },
  { path: 'command-palette', title: 'Command palette', group: 'Components',
    load: () => import('./pages/command-palette').then((m) => m.CommandPalettePage) },
  { path: 'toast', title: 'Toast', group: 'Components',
    load: () => import('./pages/toast').then((m) => m.ToastPage) },
  { path: 'page', title: 'Page, header and panel', group: 'Components',
    load: () => import('./pages/page').then((m) => m.PageLayoutPage) },
  { path: 'shell', title: 'App shell', group: 'Components',
    load: () => import('./pages/shell').then((m) => m.ShellPage) },
  { path: 'tabs', title: 'Tabs', group: 'Components',
    load: () => import('./pages/tabs').then((m) => m.TabsPage) },
  { path: 'settings', title: 'Settings', group: 'Components',
    load: () => import('./pages/settings').then((m) => m.SettingsPage) },
  { path: 'data-table', title: 'Data table and stat tile', group: 'Components',
    load: () => import('./pages/data-table').then((m) => m.DataTablePage) },
];

export const GROUPS = ['Start', 'Foundations', 'Components'] as const;

export const routes: Routes = [
  ...PAGES.map((page) => ({
    path: page.path,
    title: page.path ? `${page.title} · OpenStuff Design` : 'OpenStuff Design',
    loadComponent: page.load,
  })),
  { path: '**', title: 'Not found · OpenStuff Design',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
];
