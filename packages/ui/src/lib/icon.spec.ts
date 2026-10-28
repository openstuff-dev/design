import { createIcon, type IconNode } from './icon.js';

const CHECK: IconNode = [['path', { d: 'M20 6 9 17l-5-5' }]];

describe('createIcon', () => {
  it('builds a decorative svg from an icon node', () => {
    const svg = createIcon(CHECK, { size: 'lg', flipInRtl: true });
    expect(svg.getAttribute('class')).toBe('os-icon');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.dataset.size).toBe('lg');
    expect(svg.hasAttribute('data-flip-rtl')).toBe(true);
    expect(svg.innerHTML).toBe('<path d="M20 6 9 17l-5-5"></path>');
  });

  it('leaves out data-size for the default size', () => {
    expect(createIcon(CHECK).hasAttribute('data-size')).toBe(false);
  });
});
