import { ChangeDetectionStrategy, Component, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName, query, render } from '../testing';
import { provideTheme, Theme, ThemePicker } from './theme';

@Component({
  imports: [ThemePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<os-theme-picker />',
})
class Host {}

const root = document.documentElement;

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    root.removeAttribute('data-theme');
  });

  it('applies a choice at once and stores it under the app\'s own key', () => {
    TestBed.configureTestingModule({ providers: [provideTheme({ storageKey: 'one.theme' })] });
    TestBed.inject(Theme).set('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('one.theme')).toBe('dark');
    expect(localStorage.length).toBe(1);
  });

  it('follows the device on system, with no attribute and nothing stored', () => {
    localStorage.setItem('openstuff.theme', 'dark');
    const theme = TestBed.inject(Theme);
    expect(root.getAttribute('data-theme')).toBe('dark');
    theme.set('system');
    expect(root.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('openstuff.theme')).toBeNull();
  });

  it('applies the stored choice when the app starts, without anything asking for it', () => {
    localStorage.setItem('one.theme', 'light');
    TestBed.configureTestingModule({ providers: [provideTheme({ storageKey: 'one.theme' })] });
    TestBed.inject(EnvironmentInjector);
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('ignores a choice stored by another app, or nonsense', () => {
    localStorage.setItem('two.theme', 'dark');
    localStorage.setItem('one.theme', 'purple');
    TestBed.configureTestingModule({ providers: [provideTheme({ storageKey: 'one.theme' })] });
    expect(TestBed.inject(Theme).choice()).toBe('system');
  });

  it('still changes the page when storage is not available', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Denied');
    });
    TestBed.inject(Theme).set('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    vi.restoreAllMocks();
  });
});

describe('ThemePicker', () => {
  beforeEach(() => {
    localStorage.clear();
    root.removeAttribute('data-theme');
  });

  it('is a named group of three native radios, with the current one chosen', async () => {
    localStorage.setItem('openstuff.theme', 'dark');
    const { root: picker } = await render(Host);
    expect(accessibleName(query(picker, '[role="radiogroup"]', HTMLElement))).toBe('Theme');
    const radios = [...picker.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(radios.map((radio) => accessibleName(radio))).toEqual(['System', 'Light', 'Dark']);
    expect(radios.map((radio) => radio.checked)).toEqual([false, false, true]);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
  });

  it('applies what the person chooses', async () => {
    const { fixture, root: picker } = await render(Host);
    query(picker, 'input[value="dark"]', HTMLInputElement).click();
    await fixture.whenStable();
    expect(root.getAttribute('data-theme')).toBe('dark');
    query(picker, 'input[value="system"]', HTMLInputElement).click();
    await fixture.whenStable();
    expect(root.hasAttribute('data-theme')).toBe(false);
  });
});
