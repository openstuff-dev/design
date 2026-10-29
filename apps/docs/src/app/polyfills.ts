import { InjectionToken } from '@angular/core';
import type { Polyfill, Support } from '@openstuff-dev/ui/polyfills';

/** What this browser has natively and which polyfills it loaded, for the browser support page. */
export const BROWSER_SUPPORT = new InjectionToken<{ native: Support; loaded: Polyfill[] }>(
  'BROWSER_SUPPORT',
);
