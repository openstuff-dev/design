import { bootstrapApplication } from '@angular/platform-browser';
import { detectSupport, loadPolyfills } from '@openstuff-dev/ui/polyfills';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { BROWSER_SUPPORT } from './app/polyfills';

// Before loading, since a polyfill makes its feature look native.
const native = detectSupport();
const loaded = await loadPolyfills(native);
await bootstrapApplication(App, {
  providers: [...appConfig.providers, { provide: BROWSER_SUPPORT, useValue: { native, loaded } }],
});
