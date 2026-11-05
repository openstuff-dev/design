import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button } from '../button/button';
import { SectionHeader } from '../page/page';
import { accessibleName, query, render } from '../testing';
import { IntegrationCard, type IntegrationStatus } from './integration-card';
import { SettingCard, SettingItem } from './settings';

@Component({
  imports: [Button, IntegrationCard, SectionHeader, SettingCard, SettingItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header os-section-header title="Tokens" description="One per device." [level]="2">
      <button os-button type="button">New token</button>
    </header>
    <section os-setting-card>
      <os-setting-item title="Laptop" meta="Used today">
        <span id="tag" os-setting-item-tag>Read only</span>
        <button os-button type="button">Revoke</button>
      </os-setting-item>
      <os-setting-item title="Old phone" archived />
    </section>
    <os-integration-card name="OpenVersion" description="Tells open tabs." [status]="status()">
      <svg id="mark" os-integration-mark></svg>
      <button os-button os-actions type="button">Remove</button>
      <form id="form"></form>
    </os-integration-card>
    <os-integration-card id="second" name="OpenAnnounce" statusLabel="Set by the chart" />
  `,
})
class Host {
  readonly status = signal<IntegrationStatus>('not-connected');
}

describe('SectionHeader', () => {
  it('shows a heading, a line and actions, without a stray title tooltip', async () => {
    const { root } = await render(Host);
    const header = query(root, 'header', HTMLElement);
    expect(header.hasAttribute('title')).toBe(false);
    expect(header.querySelector('h2')?.textContent).toBe('Tokens');
    expect(header.querySelector('p')?.textContent).toBe('One per device.');
    expect(header.querySelector('.os-section-header-actions button')).not.toBeNull();
  });
});

describe('SettingItem', () => {
  it('shows a title, a line, a tag and actions', async () => {
    const { root } = await render(Host);
    const item = query(root, 'os-setting-item', HTMLElement);
    expect(item.hasAttribute('title')).toBe(false);
    expect(item.querySelector('.os-setting-item-title #tag')).not.toBeNull();
    expect(item.querySelector('.os-setting-item-meta')?.textContent).toBe('Used today');
    expect(item.querySelector('.os-setting-item-actions button')).not.toBeNull();
    expect(item.hasAttribute('data-archived')).toBe(false);
  });

  it('marks an archived item', async () => {
    const { root } = await render(Host);
    const item = query(root, 'os-setting-item[data-archived]', HTMLElement);
    expect(item.textContent).toContain('Old phone');
    expect(item.querySelector('.os-setting-item-meta')).toBeNull();
  });
});

describe('IntegrationCard', () => {
  it('is named by the service and puts each part in its place', async () => {
    const { root } = await render(Host);
    const card = query(root, 'os-integration-card', HTMLElement);
    expect(accessibleName(card)).toBe('OpenVersion');
    expect(card.querySelector('.os-integration-card-mark #mark')).not.toBeNull();
    expect(card.querySelector('.os-integration-card-actions button')).not.toBeNull();
    expect(card.querySelector('.os-integration-card-description')?.textContent).toBe(
      'Tells open tabs.',
    );
    expect(card.querySelector('.os-integration-card-body #form')).not.toBeNull();
  });

  it.each([
    ['not-connected', 'Not connected', 'neutral'],
    ['connected', 'Connected', 'success'],
    ['problem', 'Problem', 'danger'],
    ['server', 'Set by the server', 'info'],
  ] as const)('reads out the status %s', async (status, label, tone) => {
    const { fixture, host, root } = await render(Host);
    host.status.set(status);
    await fixture.whenStable();
    const dot = query(root, '[role="status"]', HTMLElement);
    expect(dot.textContent).toBe(label);
    expect(dot.getAttribute('data-tone')).toBe(tone);
  });

  it('can say the status in other words', async () => {
    const { root } = await render(Host);
    const dot = query(root, '#second [role="status"]', HTMLElement);
    expect(dot.textContent).toBe('Set by the chart');
  });
});
