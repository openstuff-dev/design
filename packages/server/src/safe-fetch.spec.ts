import { describe, expect, it } from 'vitest';
import { FetchRefused, isInternalAddress, safeFetch, type FetchPolicy } from './safe-fetch.js';

const publicOnly: FetchPolicy = { mode: 'public', allow: [], envPrefix: 'OPENTEST' };

describe('isInternalAddress', () => {
  it.each(['10.1.2.3', '127.0.0.1', '169.254.169.254', '192.168.1.1', '::1', 'fe80::1', '::ffff:10.0.0.5'])(
    'treats %s as internal',
    (address) => {
      expect(isInternalAddress(address)).toBe(true);
    },
  );

  it.each(['93.184.216.34', '2606:4700:4700::1111'])('treats %s as public', (address) => {
    expect(isInternalAddress(address)).toBe(false);
  });
});

describe('safeFetch refusals', () => {
  it('refuses a URL that is not http or https', async () => {
    await expect(safeFetch('file:///etc/passwd', publicOnly)).rejects.toThrow(FetchRefused);
  });

  it('refuses a URL with a user name or password', async () => {
    await expect(safeFetch('https://user:pw@example.com/', publicOnly)).rejects.toThrow(
      'Leave the user name and password out of the URL.',
    );
  });

  it('refuses an internal address literal in public mode, naming the setting to change', async () => {
    await expect(safeFetch('http://127.0.0.1:8080/', publicOnly)).rejects.toThrow(
      'set OPENTEST_FETCH=private (and list the host in OPENTEST_FETCH_ALLOW)',
    );
  });

  it('refuses an internal host that is not in the allow list', async () => {
    const policy: FetchPolicy = { mode: 'private', allow: ['relay.internal'], envPrefix: 'OPENTEST' };
    await expect(safeFetch('http://10.0.0.7/', policy)).rejects.toThrow(FetchRefused);
  });

  it('refuses a string that is not a URL', async () => {
    await expect(safeFetch('not a url', publicOnly)).rejects.toThrow("isn't a URL");
  });
});
