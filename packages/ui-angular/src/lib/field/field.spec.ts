import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SettingRow } from '../settings/settings';
import { accessibleDescription, accessibleName, query, render } from '../testing';
import { Check, Checkbox, Control, Field, Switch } from './field';

@Component({
  imports: [Field, Control, Check, Checkbox, Switch, SettingRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-field label="Slug" hint="Used in links." [error]="error()">
      <input os-input />
    </os-field>
    <os-field label="Region"
      ><select os-select>
        <option>Europe</option>
      </select></os-field
    >
    <label os-check><input type="checkbox" os-checkbox /> Reviews</label>
    <os-setting-row label="Agent mode" description="Shows what agents read." inline>
      <input type="checkbox" os-switch />
    </os-setting-row>
  `,
})
class Host {
  readonly error = signal<string | null>(null);
}

describe('Field and controls', () => {
  it('names controls by their label and describes them by the hint and error', async () => {
    const { fixture, host, root } = await render(Host);
    const input = query(root, 'input.os-input', HTMLInputElement);
    expect(accessibleName(input)).toBe('Slug');
    expect(accessibleDescription(input)).toBe('Used in links.');
    expect(input.hasAttribute('aria-invalid')).toBe(false);

    host.error.set('Use lowercase letters.');
    await fixture.whenStable();
    expect(accessibleDescription(input)).toBe('Used in links. Use lowercase letters.');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    expect(accessibleName(query(root, 'select', HTMLSelectElement))).toBe('Region');
    expect(accessibleName(query(root, '.os-checkbox', HTMLInputElement))).toBe('Reviews');
  });

  it('gives a switch the switch role and the setting row\'s label and description', async () => {
    const { root } = await render(Host);
    const toggle = query(root, '.os-switch', HTMLInputElement);
    expect(toggle.getAttribute('role')).toBe('switch');
    expect(accessibleName(toggle)).toBe('Agent mode');
    expect(accessibleDescription(toggle)).toBe('Shows what agents read.');
  });

  it('keeps native keyboard behaviour: controls are focusable and labels toggle them', async () => {
    const { root } = await render(Host);
    const input = query(root, 'input.os-input', HTMLInputElement);
    input.focus();
    expect(document.activeElement).toBe(input);

    const toggle = query(root, '.os-switch', HTMLInputElement);
    query(root, 'os-setting-row label', HTMLLabelElement).click();
    expect(toggle.checked).toBe(true);
    // Space on a focused checkbox is a click in every browser.
    toggle.focus();
    toggle.click();
    expect(toggle.checked).toBe(false);
  });
});
