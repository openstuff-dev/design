import { generateTheme, applyTheme } from '@openstuff-dev/tokens';
import * as icons from 'lucide';
import { anchor, createIcon, detectSupport, loadPolyfills, type IconNode } from '../src/index.js';

const iconNodes = icons as unknown as Record<string, IconNode | undefined>;
const pascal = (name: string) => name.replace(/(^|-)(\w)/g, (_, _dash, c: string) => c.toUpperCase());

for (const placeholder of document.querySelectorAll<HTMLElement>('i[data-icon]')) {
  const node = iconNodes[pascal(placeholder.dataset.icon ?? '')];
  if (node) placeholder.replaceWith(createIcon(node));
}

for (const trigger of document.querySelectorAll<HTMLElement>('[data-anchor]')) {
  const popover = document.getElementById(trigger.dataset.anchor ?? '');
  if (popover) anchor(trigger, popover);
}

const form = document.querySelector('form');
const stage = document.querySelector<HTMLElement>('.stage');
form?.addEventListener('change', () => {
  const data = new FormData(form);
  const value = (name: string) => {
    const entry = data.get(name);
    return typeof entry === 'string' ? entry : '';
  };
  const theme = value('theme');
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  applyTheme(document.documentElement, generateTheme(value('primary')));
  if (stage) stage.dataset.width = value('width');
});

const toasts = document.getElementById('toasts');
let count = 0;
document.getElementById('toast-button')?.addEventListener('click', () => {
  if (!toasts) return;
  const toast = document.createElement('div');
  toast.className = 'os-toast';
  toast.role = 'status';
  toast.dataset.tone = ['success', 'info', 'danger'][count++ % 3];
  toast.innerHTML = '<p class="os-toast-message">Saved your changes</p>';
  toasts.append(toast);
  if (!toasts.matches(':popover-open')) toasts.showPopover();
  setTimeout(() => {
    toast.remove();
    if (!toasts.children.length) toasts.hidePopover();
  }, 4000);
});

const loaded = await loadPolyfills();
const status = document.getElementById('loaded');
if (status) {
  const missing = Object.entries(detectSupport()).filter(([, has]) => !has).map(([name]) => name);
  status.textContent = `Polyfills loaded: ${loaded.join(', ') || 'none'}` +
    (missing.length ? ` (missing natively: ${missing.join(', ')})` : '');
}
