import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName, query, render } from '../testing';
import { AgentBar, AgentMode, AgentShell, AgentSwitch } from './agent-mode';

@Component({
  imports: [AgentBar, AgentShell, AgentSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      os-agent-switch
      type="button"
      [active]="active()"
      [tooltip]="tip()"
      (click)="active.set(!active())"
    >
      Agent mode
    </button>
    <div os-agent-shell>
      <header os-agent-bar [exiting]="exiting()" (exit)="exits.set(exits() + 1)">
        <span os-agent-brand>OpenPurpose</span>
        <span>Agent in <strong>Acme</strong></span>
      </header>
    </div>
  `,
})
class Host {
  readonly active = signal(false);
  readonly tip = signal<string | undefined>('See what agents receive.');
  readonly exiting = signal(false);
  readonly exits = signal(0);
}

describe('AgentMode, AgentSwitch, AgentShell and AgentBar', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-agent-mode');
  });

  it('toggles data-agent-mode on the document element via AgentMode', () => {
    const mode = TestBed.inject(AgentMode);
    expect(mode.active()).toBe(false);
    expect(document.documentElement.hasAttribute('data-agent-mode')).toBe(false);

    mode.set(true);
    expect(mode.active()).toBe(true);
    expect(document.documentElement.hasAttribute('data-agent-mode')).toBe(true);

    mode.toggle();
    expect(mode.active()).toBe(false);
    expect(document.documentElement.hasAttribute('data-agent-mode')).toBe(false);
  });

  it('renders AgentSwitch with switch role, state and anchored tooltip', async () => {
    const { fixture, host, root } = await render(Host);
    const button = query(root, 'button[os-agent-switch]', HTMLButtonElement);
    expect(button.getAttribute('role')).toBe('switch');
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(accessibleName(button)).toBe('Agent mode');

    const tipId = button.getAttribute('aria-describedby') ?? '';
    expect(tipId).not.toBe('');
    const tip = document.getElementById(tipId);
    expect(tip?.textContent).toBe('See what agents receive.');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-checked')).toBe('true');

    host.tip.set(undefined);
    await fixture.whenStable();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(document.getElementById(tipId)).toBeNull();
  });

  it('renders AgentShell and AgentBar with brand, context and exit action', async () => {
    const { fixture, host, root } = await render(Host);
    const shell = query(root, '[os-agent-shell]', HTMLElement);
    expect(shell.classList.contains('os-agent-shell')).toBe(true);
    expect(query(shell, '.os-agent-bar-brand', HTMLElement).textContent.trim()).toBe('OpenPurpose');
    expect(query(shell, '.os-agent-bar-context', HTMLElement).textContent.trim()).toBe(
      'Agent in Acme',
    );

    const exit = query(shell, 'header[os-agent-bar] button', HTMLButtonElement);
    expect(accessibleName(exit)).toBe('Exit agent mode');
    exit.click();
    expect(host.exits()).toBe(1);

    host.exiting.set(true);
    await fixture.whenStable();
    expect(exit.disabled).toBe(true);
  });
});
