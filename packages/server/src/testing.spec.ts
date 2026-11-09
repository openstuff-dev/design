import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openAnnounce, openVersion } from './integrations.js';
import { publishOwnVersion } from './publish.js';
import { type StandIn, standInOpenAnnounce, standInOpenVersion } from './testing.js';

const policy = { mode: 'private' as const, allow: [], envPrefix: 'OPENTEST' };
const context = { policy, origin: 'https://app.example.com', userAgent: 'OpenTest' };
const log = { info: () => undefined, warn: () => undefined };

describe('the OpenVersion stand-in', () => {
  let ov: StandIn;
  beforeAll(async () => {
    ov = await standInOpenVersion({
      publicKey: 'pk_app_key_1234',
      deployToken: 'ov_deploy_1234',
      allowedOrigins: ['https://app.example.com'],
    });
  });
  afterAll(() => ov.close());

  it('passes the package’s check with the right key and deploy token', async () => {
    const offer = openVersion;
    await expect(
      offer.check({ url: ov.url, publicKey: 'pk_app_key_1234', deployToken: 'ov_deploy_1234' }, context),
    ).resolves.toBeTruthy();
  });

  it('refuses another key, another deploy token and another origin, as OpenVersion does', async () => {
    const offer = openVersion;
    await expect(offer.check({ url: ov.url, publicKey: 'pk_other_1234' }, context)).rejects.toThrow(/recognise/);
    await expect(
      offer.check({ url: ov.url, publicKey: 'pk_app_key_1234', deployToken: 'ov_wrong_1234' }, context),
    ).rejects.toThrow(/deploy token/);
    await expect(
      offer.check({ url: ov.url, publicKey: 'pk_app_key_1234' }, { ...context, origin: 'https://other.example.com' }),
    ).rejects.toThrow(/https:\/\/other\.example\.com/);
  });

  it('records a publish, and answers it with the status asked for', async () => {
    ov.requests.length = 0;
    const outcome = await publishOwnVersion({ url: ov.url, deployToken: 'ov_deploy_1234' }, '2.0.0', {
      policy,
      appName: 'OpenTest',
      log,
    });
    expect(outcome).toBe('published');
    expect(ov.requests).toMatchObject([{ method: 'POST', path: '/api/v1/releases' }]);
    expect(JSON.parse(ov.requests[0].body)).toMatchObject({ version: '2.0.0' });

    const older = await standInOpenVersion({ publicKey: 'pk', deployToken: 'ov_deploy_1234', publishStatus: 409 });
    try {
      const again = await publishOwnVersion({ url: older.url, deployToken: 'ov_deploy_1234' }, '1.0.0', {
        policy,
        appName: 'OpenTest',
        log,
      });
      expect(again).toBe('not-newer');
    } finally {
      await older.close();
    }
  });
});

describe('the OpenAnnounce stand-in', () => {
  let oa: StandIn;
  beforeAll(async () => {
    oa = await standInOpenAnnounce({ publicKey: 'pk_feed_1234', allowedOrigins: ['https://app.example.com'] });
  });
  afterAll(() => oa.close());

  it('passes the package’s check with the right key and origin, and refuses the rest', async () => {
    const offer = openAnnounce;
    await expect(offer.check({ url: oa.url, publicKey: 'pk_feed_1234' }, context)).resolves.toBeTruthy();
    await expect(offer.check({ url: oa.url, publicKey: 'pk_other_1234' }, context)).rejects.toThrow(/recognise/);
    await expect(
      offer.check({ url: oa.url, publicKey: 'pk_feed_1234' }, { ...context, origin: 'https://other.example.com' }),
    ).rejects.toThrow(/https:\/\/other\.example\.com/);
  });
});
