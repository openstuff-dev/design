import { describe, expect, it } from 'vitest';
import {
  ConnectionStringError,
  isConnectionString,
  makeConnectionString,
  parseConnectionString,
} from './connection-string.js';

describe('connection strings', () => {
  it('keeps the address, the public key and every secret given', () => {
    const details = {
      url: 'https://announce.example.com',
      publicKey: 'pk_feed_1234',
      signingSecret: 'sec_ålø_✓',
      publishKey: 'pub_5678',
    };
    const text = makeConnectionString('openannounce', details);
    expect(text).toMatch(/^openannounce\+[\w-]+$/);
    expect(parseConnectionString(text, 'openannounce')).toEqual(details);
  });

  it('leaves out secrets that are empty', () => {
    const text = makeConnectionString('openversion', {
      url: 'https://version.example.com',
      publicKey: 'pk_1',
      deployToken: '',
    });
    expect(parseConnectionString(text, 'openversion')).toEqual({
      url: 'https://version.example.com',
      publicKey: 'pk_1',
    });
  });

  it('reads the format the Buffer version wrote', () => {
    const body = { url: 'https://v.example.com', publicKey: 'pk_1', deployToken: 'tok_2' };
    const text = `openversion+${Buffer.from(JSON.stringify(body)).toString('base64url')}`;
    expect(parseConnectionString(text, 'openversion')).toEqual(body);
  });

  it('tells a string from a product by its prefix, ignoring case and spaces', () => {
    expect(isConnectionString('  OpenAnnounce+abc', 'openannounce')).toBe(true);
    expect(isConnectionString('pub_5678', 'openannounce')).toBe(false);
    expect(isConnectionString('openversion+abc', 'openannounce')).toBe(false);
  });

  it('refuses a string from the other product, naming both', () => {
    const text = makeConnectionString('openannounce', { url: 'https://a.example.com', publicKey: 'pk' });
    expect(() => parseConnectionString(text, 'openversion')).toThrow(
      new ConnectionStringError('That’s a connection string from OpenAnnounce. Paste one from OpenVersion.'),
    );
  });

  it('refuses text that isn’t one', () => {
    for (const text of ['hello', 'openversion+not json', 'openversion+bm90IGpzb24', 'openversion+e30']) {
      expect(() => parseConnectionString(text, 'openversion')).toThrow(ConnectionStringError);
    }
  });
});
