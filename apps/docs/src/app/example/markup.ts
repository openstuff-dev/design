/** Elements that never have children. */
const VOID = new Set(['area', 'br', 'col', 'hr', 'img', 'input', 'link', 'meta', 'source', 'wbr']);

/** Children that stay on the parent's line, like the paths of an icon. */
const INLINE_PARENTS = new Set(['svg']);

const LINE = 96;

/** Attributes only Angular needs: style encapsulation, debugging and component selectors. */
function angularOnly(name: string): boolean {
  return name.startsWith('_ng') || name.startsWith('ng-') || name.startsWith('os-');
}

/**
 * The HTML attributes a component host keeps. Angular also writes static inputs (`tone`,
 * `label`, `title`) onto the host; the CSS reads their `data-*` and ARIA forms instead.
 */
const HOST_ATTRIBUTES = new Set([
  'autocomplete', 'checked', 'class', 'closedby', 'command', 'commandfor', 'disabled', 'for',
  'href', 'id', 'interestfor', 'name', 'open', 'placeholder', 'popover', 'rel', 'role', 'rows',
  'spellcheck', 'style', 'tabindex', 'target', 'type', 'value',
]);

function isHost(element: Element): boolean {
  return (
    element.localName.startsWith('os-') ||
    Array.from(element.attributes).some(({ name }) => name.startsWith('os-'))
  );
}

function keepAttribute(name: string, host: boolean): boolean {
  if (angularOnly(name)) return false;
  if (!host || name.startsWith('aria-') || name.startsWith('data-')) return true;
  return HOST_ATTRIBUTES.has(name);
}

function attributes(element: Element): string {
  const host = isHost(element);
  let out = '';
  for (const { name, value } of Array.from(element.attributes)) {
    if (!keepAttribute(name, host)) continue;
    if (name === 'class' && !value.trim()) continue;
    out += value === '' ? ` ${name}` : ` ${name}="${value.replaceAll('"', '&quot;')}"`;
  }
  return out;
}

/** A component's host element (`<os-callout>`) is written as the `<div>` it stands for. */
function tagName(element: Element): string {
  const tag = element.localName;
  return tag.startsWith('os-') || tag.startsWith('docs-') ? 'div' : tag;
}

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function children(node: Node): Node[] {
  return Array.from(node.childNodes).filter(
    (child) =>
      child.nodeType === Node.ELEMENT_NODE ||
      (child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim() !== ''),
  );
}

function compact(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escape((node.textContent ?? '').replace(/\s+/g, ' ').trim());
  const element = node as Element;
  const tag = tagName(element);
  const open = `<${tag}${attributes(element)}>`;
  if (VOID.has(tag)) return open;
  return `${open}${children(element).map(compact).join(' ')}</${tag}>`;
}

function format(node: Node, depth: number): string[] {
  const indent = '  '.repeat(depth);
  const flat = compact(node);
  if (node.nodeType === Node.TEXT_NODE) return flat ? [indent + flat] : [];

  const element = node as Element;
  const tag = tagName(element);
  const kids = children(element);
  const short = indent.length + flat.length <= LINE;
  if (VOID.has(tag) || kids.length === 0 || INLINE_PARENTS.has(tag)) return [indent + flat];
  if (short && kids.every((kid) => kid.nodeType === Node.TEXT_NODE || !children(kid).length)) {
    return [indent + flat];
  }
  return [
    `${indent}<${tag}${attributes(element)}>`,
    ...kids.flatMap((kid) => format(kid, depth + 1)),
    `${indent}</${tag}>`,
  ];
}

/**
 * The plain HTML that an example's Angular components rendered, without Angular's own
 * attributes and comments, indented. This is what a page without Angular writes by hand.
 */
export function toMarkup(root: Element): string {
  // Skip the example's own component, <docs-…>, and write what it renders.
  const kids = children(root);
  const only = kids.length === 1 ? kids[0] : null;
  if (only instanceof Element && only.localName.startsWith('docs-')) return toMarkup(only);
  return kids
    .flatMap((node) => format(node, 0))
    .join('\n');
}

/** Removes the indentation a template literal picks up from the code around it. */
export function dedent(code: string): string {
  const lines = code.replace(/^\n/, '').trimEnd().split('\n');
  const indents = lines.filter((line) => line.trim()).map((line) => /^ */.exec(line)?.[0].length ?? 0);
  const min = Math.min(...indents);
  return lines.map((line) => line.slice(min)).join('\n');
}
