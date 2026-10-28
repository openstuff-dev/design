import { anchor } from './anchor.js';

vi.mock('./polyfills.js', () => ({ positionAnchors: vi.fn(() => Promise.resolve()) }));

describe('anchor', () => {
  it('gives each pair its own anchor name, and undoes it', () => {
    const [button, menu, other, tip] = ['button', 'div', 'button', 'div'].map((tag) =>
      document.createElement(tag),
    );
    const undo = anchor(button, menu);
    anchor(other, tip);

    const name = button.style.getPropertyValue('anchor-name');
    expect(name).toMatch(/^--os-anchor-\d+$/);
    expect(menu.style.getPropertyValue('position-anchor')).toBe(name);
    expect(other.style.getPropertyValue('anchor-name')).not.toBe(name);

    undo();
    expect(button.style.getPropertyValue('anchor-name')).toBe('');
    expect(menu.style.getPropertyValue('position-anchor')).toBe('');
  });
});
