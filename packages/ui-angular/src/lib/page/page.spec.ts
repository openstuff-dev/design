import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button } from '../button/button';
import { accessibleName, press, query, render } from '../testing';
import { Breadcrumbs, Card, Page, PageHeader, Panel } from './page';
import { Tab, Tabs } from './tabs';

@Component({
  imports: [Breadcrumbs, Button, Card, Page, PageHeader, Panel, Tab, Tabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main os-page width="narrow">
      <nav os-breadcrumbs>
        <ol>
          <li><a href="/projects">Projects</a></li>
          <li><span aria-current="page">Design</span></li>
        </ol>
      </nav>
      <header os-page-header title="Design" description="The shared toolkit.">
        <button os-button type="button" variant="primary">New rule</button>
      </header>
      <section os-panel title="Members" description="People who can edit.">
        <button os-button os-actions type="button" size="sm">Invite</button>
        <p>Kim</p>
      </section>
      <a os-card href="/x">Card</a>
      <os-tabs label="Project" [(selected)]="tab">
        <ng-template os-tab="overview" label="Overview"><p>Overview content</p></ng-template>
        <ng-template os-tab="rules" label="Rules"><p>Rules content</p></ng-template>
        <ng-template os-tab="billing" label="Billing" disabled><p>Billing</p></ng-template>
        <ng-template os-tab="history" label="History"><p>History content</p></ng-template>
      </os-tabs>
    </main>
  `,
})
class Host {
  readonly tab = signal<string | undefined>(undefined);
}

describe('Page, PageHeader, Breadcrumbs, Panel and Card', () => {
  it('names the page heading, breadcrumbs and panel', async () => {
    const { root } = await render(Host);
    expect(query(root, 'main', HTMLElement).dataset['width']).toBe('narrow');
    expect(accessibleName(query(root, 'h1', HTMLHeadingElement))).toBe('Design');
    expect(accessibleName(query(root, 'nav', HTMLElement))).toBe('Breadcrumbs');
    const panel = query(root, 'section', HTMLElement);
    expect(accessibleName(panel)).toBe('Members');
    expect(query(panel, '.os-panel-header button', HTMLButtonElement).textContent.trim()).toBe('Invite');
    expect(query(root, 'a.os-card', HTMLAnchorElement).className).toBe('os-card');
  });

  it('keeps the page actions in the tab order after the heading', async () => {
    const { root } = await render(Host);
    const focusable = [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    expect(focusable.slice(0, 3).map((element) => accessibleName(element))).toEqual([
      'Projects',
      'New rule',
      'Invite',
    ]);
  });
});

describe('Tabs', () => {
  it('names the tab list and each tab, and links tabs to panels', async () => {
    const { root } = await render(Host);
    const list = query(root, '[role="tablist"]', HTMLElement);
    expect(accessibleName(list)).toBe('Project');
    const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map((tab) => accessibleName(tab))).toEqual(['Overview', 'Rules', 'Billing', 'History']);
    const panel = document.getElementById(tabs[0].getAttribute('aria-controls') ?? '');
    expect(panel?.getAttribute('role')).toBe('tabpanel');
  });

  it('selects the first tab, and moves with arrow keys, skipping disabled tabs', async () => {
    const { fixture, host, root } = await render(Host);
    const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(host.tab()).toBe('overview');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(root.textContent).toContain('Overview content');

    tabs[0].focus();
    press(tabs[0], 'ArrowRight');
    await fixture.whenStable();
    expect(host.tab()).toBe('rules');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);

    press(tabs[1], 'ArrowRight');
    await fixture.whenStable();
    expect(host.tab()).toBe('history');

    press(tabs[3], 'Home');
    await fixture.whenStable();
    expect(host.tab()).toBe('overview');
  });
});
