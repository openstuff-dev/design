import { bootstrapApplication } from '@angular/platform-browser';
import { loadPolyfills } from '@openstuff-dev/ui';
import { Demo } from './demo';

await loadPolyfills();
await bootstrapApplication(Demo);
