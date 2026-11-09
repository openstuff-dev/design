import { describe, expect, it, vi } from 'vitest';
import {
  allAnnounceGroups,
  announceGroups,
  startServerIntegrations,
  type ClientConfig,
} from './server-integrations.js';

const versionAt = { url: 'https://version.example.com', publicKey: 'pk_version' };
const announceAt = { url: 'https://announce.example.com', publicKey: 'pk_announce' };

function answering(config: ClientConfig | Error, status = 200): typeof fetch {
  const fake = vi.fn(() =>
    config instanceof Error
      ? Promise.reject(config)
      : Promise.resolve(new Response(JSON.stringify(config), { status })),
  );
  return fake;
}

describe('startServerIntegrations', () => {
  it('starts OpenVersion with the build version when it is connected', async () => {
    const openversion = vi.fn();
    const started = await startServerIntegrations({
      version: '1.4.0',
      fetch: answering({ openversion: versionAt, openannounce: null }),
      load: { openversion },
    });
    expect(openversion).toHaveBeenCalledWith({ ...versionAt, version: '1.4.0' });
    expect(started).toEqual(['openversion']);
  });

  it('starts OpenAnnounce when it is connected', async () => {
    const openannounce = vi.fn();
    await startServerIntegrations({
      version: '1.4.0',
      fetch: answering({ openannounce: announceAt }),
      load: { openannounce },
    });
    expect(openannounce).toHaveBeenCalledWith(announceAt);
  });

  it('leaves OpenVersion off for a build that does not know its version', async () => {
    const openversion = vi.fn();
    for (const version of ['unknown', '', '  ']) {
      const fetch = answering({ openversion: versionAt });
      await startServerIntegrations({ version, fetch, load: { openversion } });
    }
    expect(openversion).not.toHaveBeenCalled();
  });

  it('starts nothing when a system is removed or only half there', async () => {
    const openversion = vi.fn();
    const openannounce = vi.fn();
    const started = await startServerIntegrations({
      version: '1.4.0',
      fetch: answering({ openversion: null, openannounce: { url: announceAt.url } as never }),
      load: { openversion, openannounce },
    });
    expect(started).toEqual([]);
    expect(openversion).not.toHaveBeenCalled();
    expect(openannounce).not.toHaveBeenCalled();
  });

  it('never throws when the server or a loader fails, and tells onError', async () => {
    const onError = vi.fn();
    await expect(
      startServerIntegrations({ version: '1.4.0', fetch: answering(new Error('offline')), load: {}, onError }),
    ).resolves.toEqual([]);
    await expect(
      startServerIntegrations({ version: '1.4.0', fetch: answering({}, 500), load: {}, onError }),
    ).resolves.toEqual([]);

    const openannounce = vi.fn();
    const started = await startServerIntegrations({
      version: '1.4.0',
      fetch: answering({ openversion: versionAt, openannounce: announceAt }),
      load: {
        openversion: () => Promise.reject(new Error('chunk failed')),
        openannounce,
      },
      onError,
    });
    expect(started).toEqual(['openannounce']);
    expect(onError).toHaveBeenCalledTimes(3);
  });

  it('reads /api/client-config unless told otherwise', async () => {
    const fetch = answering({});
    await startServerIntegrations({ version: '1.4.0', fetch, load: {} });
    expect(fetch).toHaveBeenCalledWith('/api/client-config', expect.anything());
  });
});

describe('announce groups', () => {
  it('names the tenant, the role and both, as the server signs them', () => {
    expect(announceGroups('acme', 'courier')).toEqual(['t-acme', 'role-courier', 't-acme-role-courier']);
  });

  it('lists every group to create for the tenants and roles', () => {
    expect(allAnnounceGroups(['acme', 'beta'], ['admin', 'courier'])).toEqual([
      't-acme',
      't-beta',
      'role-admin',
      'role-courier',
      't-acme-role-admin',
      't-acme-role-courier',
      't-beta-role-admin',
      't-beta-role-courier',
    ]);
  });
});
