/**
 * A Lucide icon node: the list of SVG children, as `lucide` exports them
 * (`import { Search } from 'lucide'`). Any 24×24 stroke icon in the same shape works.
 */
export type IconNode = readonly (readonly [tag: string, attributes: IconAttributes])[];

// Lucide's attribute type allows undefined, so its icons type-check here; undefined is skipped.
type IconAttributes = Record<string, string | number | undefined>;

const SVG = 'http://www.w3.org/2000/svg';

export interface IconOptions {
  /** `sm` (14px), `md` (16px, the default) or `lg` (20px). */
  size?: 'sm' | 'md' | 'lg';
  /** Turns the icon around in right-to-left text, for arrows that point forward. */
  flipInRtl?: boolean;
}

/**
 * Builds an `<svg class="os-icon">` from an icon node. It's decorative (`aria-hidden`): put the
 * text that names it next to it, or on the button that holds it.
 *
 * @example button.prepend(createIcon(Search))
 */
export function createIcon(node: IconNode, options: IconOptions = {}): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'os-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (options.size && options.size !== 'md') svg.setAttribute('data-size', options.size);
  if (options.flipInRtl) svg.setAttribute('data-flip-rtl', '');
  renderIcon(svg, node);
  return svg;
}

/** Replaces the children of an existing `<svg>` with an icon node's shapes. */
export function renderIcon(svg: SVGSVGElement, node: IconNode): void {
  svg.replaceChildren(
    ...node.map(([tag, attributes]) => {
      const child = document.createElementNS(SVG, tag);
      for (const [name, value] of Object.entries(attributes)) {
        if (value !== undefined) child.setAttribute(name, String(value));
      }
      return child;
    }),
  );
}
