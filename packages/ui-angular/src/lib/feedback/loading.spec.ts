import { onReturn, slowLoading } from './loading';

describe('slowLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays false for a load that finishes before the delay, so nothing flashes', async () => {
    const loading = slowLoading(300);
    const done = loading.track(Promise.resolve('fast'));
    await vi.advanceTimersByTimeAsync(0);
    expect(await done).toBe('fast');
    await vi.advanceTimersByTimeAsync(1000);
    expect(loading.slow()).toBe(false);
  });

  it('turns true after the delay and false once the load ends', async () => {
    const loading = slowLoading(300);
    let finish!: (value: string) => void;
    const done = loading.track(new Promise<string>((resolve) => (finish = resolve)));
    await vi.advanceTimersByTimeAsync(299);
    expect(loading.slow()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(loading.slow()).toBe(true);
    finish('late');
    expect(await done).toBe('late');
    expect(loading.slow()).toBe(false);
  });

  it('stays true until the last of two slow loads ends', async () => {
    const loading = slowLoading(100);
    let first!: () => void;
    let second!: () => void;
    const a = loading.track(new Promise<void>((resolve) => (first = resolve)));
    const b = loading.track(new Promise<void>((resolve) => (second = resolve)));
    await vi.advanceTimersByTimeAsync(100);
    first();
    await a;
    expect(loading.slow()).toBe(true);
    second();
    await b;
    expect(loading.slow()).toBe(false);
  });

  it('ends a failed load too, and passes the error on', async () => {
    const loading = slowLoading(100);
    const failed = loading.track(Promise.reject(new Error('down')));
    await expect(failed).rejects.toThrow('down');
    expect(loading.slow()).toBe(false);
  });
});

describe('onReturn', () => {
  it('calls back on focus and when the network comes back, until stopped', () => {
    const fn = vi.fn();
    const stop = onReturn(fn);
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    expect(fn).toHaveBeenCalledTimes(2);
    stop();
    window.dispatchEvent(new Event('focus'));
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
