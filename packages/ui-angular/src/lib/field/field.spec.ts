import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SettingRow } from '../settings/settings';
import { accessibleDescription, accessibleName, query, render } from '../testing';
import { Check, Checkbox, Control, Field, FileInput, Switch } from './field';

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

@Component({
  imports: [Control, Field, FileInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-field id="optional" label="Nickname" optional><input os-input /></os-field>
    <os-field id="plain" label="Name"><input os-input /></os-field>
    <os-field id="rich"
      ><span os-field-label>Email <a href="#why">Why?</a></span
      ><input os-input
    /></os-field>
    <os-field id="file" label="File to import" hint="A JSON file." [error]="error()">
      <input type="file" os-file-input accept=".json" />
    </os-field>
    <input id="alone" type="file" os-file-input aria-label="Photo" />
  `,
})
class LabelHost {
  readonly error = signal<string | null>(null);
}

describe('Field labels and FileInput', () => {
  it('adds a quiet "(optional)" that is part of the control\'s name', async () => {
    const { root } = await render(LabelHost);
    const label = query(root, '#optional label', HTMLLabelElement);
    expect(label.querySelector('.os-label-optional')?.textContent.trim()).toBe('(optional)');
    expect(accessibleName(query(root, '#optional input', HTMLInputElement))).toBe(
      'Nickname (optional)',
    );
    expect(root.querySelector('#plain .os-label-optional')).toBeNull();
  });

  it('takes markup in the label and still wires it to the control', async () => {
    const { root } = await render(LabelHost);
    expect(root.querySelector('#rich label a')).not.toBeNull();
    expect(accessibleName(query(root, '#rich input', HTMLInputElement))).toBe('Email Why?');
  });

  it('labels and describes a file input, and marks it invalid', async () => {
    const { fixture, host, root } = await render(LabelHost);
    const input = query(root, '#file input', HTMLInputElement);
    expect(input.classList.contains('os-file-input')).toBe(true);
    expect(input.accept).toBe('.json');
    expect(accessibleName(input)).toBe('File to import');
    expect(accessibleDescription(input)).toBe('A JSON file.');
    expect(input.hasAttribute('aria-invalid')).toBe(false);

    host.error.set('That isn\'t a JSON file.');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(accessibleDescription(input)).toContain('That isn\'t a JSON file.');
  });

  it('works without a field', async () => {
    const { root } = await render(LabelHost);
    const input = query(root, '#alone', HTMLInputElement);
    expect(accessibleName(input)).toBe('Photo');
  });
});
