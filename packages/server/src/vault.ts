import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/** Encrypts and decrypts integration keys with AES-256-GCM. */
export interface Vault {
  seal(plain: string): string;
  open(sealed: string): string;
}

/**
 * A vault keyed by a secret string. The sealed form is `iv.tag.data`, each part base64url, so a
 * sealed value can be stored in any text column. Every seal uses a fresh random IV.
 */
export function vaultFor(secret: string): Vault {
  const key = createHash('sha256').update(secret).digest();
  return {
    seal(plain) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.');
    },
    open(sealed) {
      const parts = sealed.split('.');
      if (parts.length !== 3) throw new Error('This key is damaged. Enter it again.');
      const [iv, tag, data] = parts.map((part) => Buffer.from(part, 'base64url'));
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      try {
        return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
      } catch {
        throw new Error('This key can’t be read with the current secret key. Enter it again.');
      }
    },
  };
}

/** The part of a database pool the loader needs. A `pg` Pool satisfies it. */
export interface SettingsStore {
  query(text: string, values: unknown[]): Promise<{ rows: { value: string; inserted: boolean }[] }>;
}

export interface VaultOptions {
  /** The configured secret, if the environment set one. */
  secret: string | undefined;
  /** The environment variable name, for the warning, such as `OPENVERSION_SECRET_KEY`. */
  envName: string;
  /** Where a generated secret is kept when none is configured. */
  settingName?: string;
  log: { warn(message: string): void };
}

/**
 * The vault for a configured secret. Without one, a secret is made on first start and kept in
 * the database, with a warning: a database dump alone could then reveal the keys.
 */
export async function loadVault(store: SettingsStore, options: VaultOptions): Promise<Vault> {
  if (options.secret) return vaultFor(options.secret);
  const name = options.settingName ?? 'secret_key';
  const { rows } = await store.query(
    `INSERT INTO server_settings (name, value) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET value = server_settings.value
     RETURNING value, (xmax = 0) AS inserted`,
    [name, randomBytes(32).toString('base64url')],
  );
  const row = rows[0];
  const made = row.inserted ? 'Made a secret key and stored it in the database. ' : '';
  options.log.warn(
    made +
    `${options.envName} isn’t set, so integration keys are encrypted with a key kept in the ` +
    `database. Set ${options.envName} on a server, so a database dump alone can’t reveal them.`,
  );
  return vaultFor(row.value);
}
