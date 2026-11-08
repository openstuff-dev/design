import { describe, expect, it } from 'vitest';
import { loadVault, vaultFor, type SettingsStore } from './vault.js';

const quietLog = { warn: () => undefined };

describe('vaultFor', () => {
  it('opens what it sealed', () => {
    const vault = vaultFor('a secret');
    expect(vault.open(vault.seal('ov_live_token'))).toBe('ov_live_token');
  });

  it('seals the same text differently each time', () => {
    const vault = vaultFor('a secret');
    expect(vault.seal('same')).not.toBe(vault.seal('same'));
  });

  it('refuses to open with another secret', () => {
    const sealed = vaultFor('one').seal('value');
    expect(() => vaultFor('two').open(sealed)).toThrow('Enter it again.');
  });

  it('refuses a value that was changed', () => {
    const vault = vaultFor('a secret');
    const [iv, tag, data] = vault.seal('value').split('.');
    const changed = `${iv}.${tag}.${data.slice(0, -2)}AA`;
    expect(() => vault.open(changed)).toThrow();
  });

  it('refuses a value that is not in the sealed form', () => {
    expect(() => vaultFor('a secret').open('nope')).toThrow('This key is damaged.');
  });
});

/** An in-memory stand-in for the server_settings table. */
function memoryStore(
  initial: Record<string, string> = {},
): SettingsStore & { rows: Record<string, string> } {
  const rows = { ...initial };
  return {
    rows,
    query(_text, values) {
      const [name, fresh] = values as [string, string];
      const inserted = !(name in rows);
      rows[name] ??= fresh;
      return Promise.resolve({ rows: [{ value: rows[name], inserted }] });
    },
  };
}

describe('loadVault', () => {
  it('uses the configured secret without touching the store', async () => {
    const store = memoryStore();
    const vault = await loadVault(store, {
      secret: 'configured',
      envName: 'OPENTEST_SECRET_KEY',
      log: quietLog,
    });
    expect(vault.open(vaultFor('configured').seal('x'))).toBe('x');
    expect(store.rows).toEqual({});
  });

  it('makes and stores a secret when none is configured, and warns once', async () => {
    const store = memoryStore();
    const warnings: string[] = [];
    const vault = await loadVault(store, {
      secret: undefined,
      envName: 'OPENTEST_SECRET_KEY',
      log: { warn: (message) => warnings.push(message) },
    });
    expect(store.rows.secret_key).toBeTruthy();
    expect(warnings[0]).toContain('Made a secret key and stored it in the database.');
    expect(warnings[0]).toContain('OPENTEST_SECRET_KEY');
    expect(vault.open(vaultFor(store.rows.secret_key).seal('y'))).toBe('y');
  });

  it('keeps the stored secret on the next start', async () => {
    const store = memoryStore({ secret_key: 'stored-already' });
    const warnings: string[] = [];
    await loadVault(store, {
      secret: undefined,
      envName: 'OPENTEST_SECRET_KEY',
      log: { warn: (message) => warnings.push(message) },
    });
    expect(store.rows.secret_key).toBe('stored-already');
    expect(warnings[0]).not.toContain('Made a secret key');
  });
});
