import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button/button';
import { StatTile } from './data/data-table';
import { Callout } from './feedback/feedback';
import { Control, Field } from './field/field';
import { PageHeader } from './page/page';
import { Popover } from './popover/popover';
import { SettingCard } from './settings/settings';
import { accessibleDescription, accessibleName, query, render } from './testing';
import { Toaster } from './toast/toast';

@Component({
  imports: [Button, Callout, Control, Field, PageHeader, Popover, SettingCard, StatTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header os-page-header title="Payments" align="start">
      <p os-page-meta>3 repositories</p>
    </header>
    <os-callout tone="success" title="Token created" level="2"><p>Copy it now.</p></os-callout>
    <h2 id="org-heading">Organizations</h2>
    <section os-setting-card aria-labelledby="org-heading"></section>
    <os-stat-tile label="Reads" value="12"><svg class="spark"></svg></os-stat-tile>
    <button os-button variant="link" tone="danger" type="button">Remove</button>
    <p id="slug-help">Lowercase letters and dashes.</p>
    <os-field label="Slug" hint="Used in links.">
      <input os-input aria-describedby="slug-help" />
    </os-field>
    <div os-popover aria-label="Organizations" align="end">…</div>
  `,
})
class Host {}

describe('Toolkit follow-ups from OpenPurpose', () => {
  it('puts meta content under the page title and the actions at the top', async () => {
    const { root } = await render(Host);
    const header = query(root, '.os-page-header', HTMLElement);
    expect(header.dataset['align']).toBe('start');
    expect(query(header, '.os-page-meta', HTMLElement).textContent).toContain('3 repositories');
  });

  it('can make a callout title a heading, and wraps its body in .os-callout-body', async () => {
    const { root } = await render(Host);
    const title = query(root, '.os-callout-title', HTMLElement);
    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('2');
    expect(query(root, '.os-callout-body', HTMLElement).textContent).toBe('Copy it now.');
  });

  it('leaves out the setting card header without a title, and keeps the page label', async () => {
    const { root } = await render(Host);
    const card = query(root, '.os-setting-card', HTMLElement);
    expect(card.querySelector('.os-setting-card-header')).toBeNull();
    expect(accessibleName(card)).toBe('Organizations');
  });

  it('projects content into a stat tile and colours a danger link', async () => {
    const { root } = await render(Host);
    expect(query(root, '.os-stat-tile .spark', SVGElement)).toBeTruthy();
    expect(query(root, '.os-button[data-variant="link"]', HTMLElement).dataset['tone']).toBe(
      'danger',
    );
  });

  it('keeps an aria-describedby the template sets, before the field hint', async () => {
    const { root } = await render(Host);
    const input = query(root, 'input', HTMLInputElement);
    expect(input.getAttribute('aria-describedby')?.split(' ')[0]).toBe('slug-help');
    expect(accessibleDescription(input)).toBe('Lowercase letters and dashes. Used in links.');
  });

  it('lines a popover up with the end of its trigger', async () => {
    const { root } = await render(Host);
    expect(query(root, '.os-popover', HTMLElement).dataset['align']).toBe('end');
  });
});

describe('Toaster limit', () => {
  afterEach(() => {
    document.querySelector('os-toast-region')?.remove();
  });

  it('shows at most four toasts, closing the oldest', async () => {
    const toaster = TestBed.inject(Toaster);
    for (const n of [1, 2, 3, 4, 5]) toaster.show(`Saved ${n}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();
    const messages = [...document.querySelectorAll('.os-toast-message')].map((m) => m.textContent);
    expect(messages).toEqual(['Saved 2', 'Saved 3', 'Saved 4', 'Saved 5']);
  });
});
