import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { accessibleName, query, render } from '../testing';
import { SegmentedControl, type SegmentOption } from './segmented-control';

@Component({
  imports: [SegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<os-segmented-control label="View" [options]="options" [(value)]="view" />',
})
class Host {
  readonly view = signal('list');
  readonly options: SegmentOption[] = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'map', label: 'Map', disabled: true },
  ];
}

describe('SegmentedControl', () => {
  it('is a radiogroup named by its label, with a named radio per option', async () => {
    const { root } = await render(Host);
    const group = query(root, 'os-segmented-control', HTMLElement);
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(accessibleName(group)).toBe('View');
    const radios = [...root.querySelectorAll('input')];
    expect(radios.map((radio) => accessibleName(radio))).toEqual(['List', 'Grid', 'Map']);
    expect(radios.map((radio) => radio.checked)).toEqual([true, false, false]);
    expect(radios[2].disabled).toBe(true);
  });

  it('uses one radio group, so arrow keys move between options and update the value', async () => {
    const { fixture, host, root } = await render(Host);
    const radios = [...root.querySelectorAll('input')];
    // The browser moves between radios with the same name on arrow keys and checks the next.
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    radios[1].focus();
    radios[1].click();
    expect(host.view()).toBe('grid');
    await fixture.whenStable();

    host.view.set('list');
    await fixture.whenStable();
    expect(radios[0].checked).toBe(true);
  });
});
