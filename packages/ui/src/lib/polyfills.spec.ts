import { loadPolyfills } from './polyfills.js';
import type { Support } from './support.js';

const popover = vi.hoisted(() => vi.fn());
const invokers = vi.hoisted(() => vi.fn());
const anchors = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('@oddbird/popover-polyfill/fn', () => ({ apply: popover }));
vi.mock('invokers-polyfill/fn', () => ({ apply: invokers }));
vi.mock('@oddbird/css-anchor-positioning/fn', () => ({ default: anchors }));

const ALL: Support = {
  popover: true,
  popoverHint: true,
  anchorPositioning: true,
  invokerCommands: true,
  interestInvokers: true,
  dialogClosedBy: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadPolyfills', () => {
  it('loads nothing in a browser that has every feature', async () => {
    expect(await loadPolyfills(ALL)).toEqual([]);
    expect(popover).not.toHaveBeenCalled();
    expect(invokers).not.toHaveBeenCalled();
    expect(anchors).not.toHaveBeenCalled();
  });

  it('loads only what is missing, popover first', async () => {
    const loaded = await loadPolyfills({ ...ALL, popover: false, invokerCommands: false });
    expect(loaded).toEqual(['popover', 'invokerCommands']);
    expect(popover).toHaveBeenCalledWith({ layerName: 'os.reset.popover-polyfill' });
    expect(popover.mock.invocationCallOrder[0])
      .toBeLessThan(invokers.mock.invocationCallOrder[0]);
  });

  it('polyfills anchor positioning once the page has loaded', async () => {
    expect(await loadPolyfills({ ...ALL, anchorPositioning: false }))
      .toEqual(['anchorPositioning']);
    expect(anchors).toHaveBeenCalledOnce();
  });
});
