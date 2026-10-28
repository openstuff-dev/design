import { applyDialogClosedBy, applyInterestInvokers, detectSupport, loadPolyfills } from '../src/index.js';

const fallbacks = new URLSearchParams(location.search).has('fallbacks');
const loaded = await loadPolyfills();
if (fallbacks) {
  applyDialogClosedBy();
  applyInterestInvokers();
}
const status = document.getElementById('loaded');
if (status) {
  status.textContent = `Polyfills: ${loaded.join(', ') || 'none needed'}${fallbacks ? ' (fallbacks forced on)' : ''}.` +
    ` Support: ${JSON.stringify(detectSupport())}`;
}
