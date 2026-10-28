import { TestBed } from '@angular/core/testing';
import { accessibleName, query } from '../testing';
import { Toaster } from './toast';

describe('Toaster', () => {
  afterEach(() => {
    document.querySelector('os-toast-region')?.remove();
  });

  async function settle(ms = 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    TestBed.tick();
  }

  it('announces messages as status, and errors as alerts, in an open region', async () => {
    const toaster = TestBed.inject(Toaster);
    toaster.show('Saved', { tone: 'success' });
    toaster.show('Couldn\'t save', { tone: 'danger' });
    await settle();
    const region = query(document.body, 'os-toast-region', HTMLElement);
    expect(region.matches(':popover-open')).toBe(true);
    const toasts = [...region.querySelectorAll('.os-toast')];
    expect(toasts.map((toast) => toast.getAttribute('role'))).toEqual(['status', 'alert']);
    expect(accessibleName(query(region, 'button', HTMLButtonElement))).toBe('Close');
  });

  it('runs its action from the keyboard, and closes after its duration', async () => {
    const toaster = TestBed.inject(Toaster);
    const run = vi.fn();
    toaster.show('Draft deleted', { action: { label: 'Undo', run } });
    toaster.show('Saved', { duration: 500 });
    await settle();
    const region = query(document.body, 'os-toast-region', HTMLElement);
    const undo = query(region, '.os-toast button', HTMLButtonElement);
    expect(accessibleName(undo)).toBe('Undo');
    undo.focus();
    undo.click();
    expect(run).toHaveBeenCalled();
    await settle();
    expect(region.querySelectorAll('.os-toast')).toHaveLength(1);

    await settle(700);
    expect(region.querySelectorAll('.os-toast')).toHaveLength(0);
    expect(region.matches(':popover-open')).toBe(false);
  });

  it('returns a function that closes the toast', async () => {
    const close = TestBed.inject(Toaster).show('Uploading', { duration: 0 });
    await settle();
    close();
    await settle();
    expect(document.querySelectorAll('.os-toast')).toHaveLength(0);
  });
});
