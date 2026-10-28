import type { IconNode } from './icon.js';

/*
 * The few icons the components draw themselves, copied from Lucide (ISC licence,
 * https://lucide.dev/license) so the core doesn't depend on it. Use `lucide` for your own icons.
 */

export const iconX: IconNode = [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]];

export const iconCheck: IconNode = [['path', { d: 'M20 6 9 17l-5-5' }]];

export const iconSearch: IconNode = [
  ['path', { d: 'm21 21-4.34-4.34' }],
  ['circle', { cx: '11', cy: '11', r: '8' }],
];

export const iconInfo: IconNode = [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M12 16v-4' }],
  ['path', { d: 'M12 8h.01' }],
];

export const iconCircleAlert: IconNode = [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
  ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }],
];

export const iconCircleCheck: IconNode = [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'm16 9-5.5 5.5L8 12' }],
];

export const iconTriangleAlert: IconNode = [
  ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }],
  ['path', { d: 'M12 9v4' }],
  ['path', { d: 'M12 17h.01' }],
];
