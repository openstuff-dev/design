import { type Signal, signal } from '@angular/core';

/** What `slowLoading()` returns: wrap a request in `track`, show a skeleton while `slow()`. */
export interface SlowLoading {
  /** True only while a tracked request has taken longer than the delay. */
  readonly slow: Signal<boolean>;
  /** Returns the same promise, and sets `slow` while it's still running after the delay. */
  track<T>(promise: Promise<T>): Promise<T>;
}

/**
 * Shows a placeholder only when loading is slow, so a fast load doesn't flash a skeleton.
 * Call it in a field initialiser or constructor.
 *
 * ```ts
 * protected readonly loading = slowLoading();
 * this.items.set(await this.loading.track(this.api.get('/items')));
 * ```
 * ```html
 * @if (items(); as items) { … } @else if (loading.slow()) { <os-skeleton [lines]="4" /> }
 * ```
 */
export function slowLoading(delay = 300): SlowLoading {
  const slow = signal(false);
  let running = 0;
  return {
    slow: slow.asReadonly(),
    track<T>(promise: Promise<T>): Promise<T> {
      running++;
      const timer = setTimeout(() => {
        slow.set(true);
      }, delay);
      return promise.finally(() => {
        clearTimeout(timer);
        running--;
        if (running === 0) slow.set(false);
      });
    },
  };
}

/**
 * Calls `fn` when the window gets focus again or the network comes back, so a page can reload
 * what may have changed while someone was away. Returns the function that stops it: pass it to
 * `DestroyRef.onDestroy`.
 */
export function onReturn(fn: () => void): () => void {
  const handler = (): void => {
    if (document.visibilityState === 'visible') fn();
  };
  window.addEventListener('focus', handler);
  window.addEventListener('online', handler);
  return () => {
    window.removeEventListener('focus', handler);
    window.removeEventListener('online', handler);
  };
}
