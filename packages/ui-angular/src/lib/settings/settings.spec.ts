import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '../button/button';
import { Control } from '../field/field';
import { accessibleDescription, accessibleName, query, render } from '../testing';
import { FormActions, SettingCard, SettingCardFooter, SettingRow } from './settings';

@Component({
  imports: [Button, Control, FormActions, SettingCard, SettingCardFooter, SettingRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section os-setting-card title="Profile" description="How others see you.">
      <os-setting-row label="Name" description="Shown to your team.">
        <input os-input />
      </os-setting-row>
      <os-setting-row label="Region"
        ><select os-select>
          <option>EU</option>
        </select></os-setting-row
      >
      <footer os-setting-card-footer>
        <div os-form-actions>
          <button os-button type="button">Cancel</button>
          <button os-button type="submit" variant="primary">Save</button>
        </div>
      </footer>
    </section>
  `,
})
class Host {}

describe('SettingCard, SettingRow and FormActions', () => {
  it('names the card by its title and each control by its row', async () => {
    const { root } = await render(Host);
    expect(accessibleName(query(root, 'section', HTMLElement))).toBe('Profile');
    const input = query(root, 'input', HTMLInputElement);
    expect(accessibleName(input)).toBe('Name');
    expect(accessibleDescription(input)).toBe('Shown to your team.');
    const select = query(root, 'select', HTMLSelectElement);
    expect(accessibleName(select)).toBe('Region');
    expect(select.hasAttribute('aria-describedby')).toBe(false);
  });

  it('puts the controls and then the actions in the tab order, main action last', async () => {
    const { root } = await render(Host);
    const order = [...root.querySelectorAll<HTMLElement>('input, select, button')];
    expect(order.map((element) => accessibleName(element))).toEqual([
      'Name',
      'Region',
      'Cancel',
      'Save',
    ]);
    // Clicking the label focuses the control in a browser.
    expect(query(root, 'os-setting-row label', HTMLLabelElement).control).toBe(
      query(root, 'input', HTMLInputElement),
    );
  });
});
