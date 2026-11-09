// No Node built-ins here: `@openstuff-dev/server/connection-string` also runs in the browser, so a
// web app can read a pasted string into its fields without a copy of this format.

/** The products a connection string can come from, by their prefix. */
const PRODUCTS: Record<string, string> = {
  openversion: 'OpenVersion',
  openannounce: 'OpenAnnounce',
};

/** What a connection string holds. Only the address and the public key are always there. */
export interface ConnectionStringDetails {
  url: string;
  publicKey: string;
  /** OpenAnnounce: signs each person's token, so messages can be aimed at a group. */
  signingSecret?: string;
  /** OpenVersion: lets the other app publish its own version on start. */
  deployToken?: string;
  /** OpenAnnounce: lets the other app post messages, such as OpenVersion's release notes. */
  publishKey?: string;
}

/** A connection string that can't be used here, with a message to show as is. */
export class ConnectionStringError extends Error {}

const SECRETS = ['deployToken', 'signingSecret', 'publishKey'] as const;

function toBase64Url(text: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Throws on anything that isn't base64url of UTF-8. */
function fromBase64Url(text: string): string {
  if (!/^[\w-]*$/.test(text)) throw new Error('not base64url');
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/**
 * Packs a connection into one value to paste: `openversion+<base64url of JSON>`. It holds the
 * secrets given, so treat it as a secret: show it once, in the secret dialog.
 */
export function makeConnectionString(kind: string, details: ConnectionStringDetails): string {
  const body: ConnectionStringDetails = { url: details.url, publicKey: details.publicKey };
  for (const key of SECRETS) {
    if (details[key]) body[key] = details[key];
  }
  return `${kind}+${toBase64Url(JSON.stringify(body))}`;
}

/** Whether `text` looks like a connection string from `kind`, so a field can offer to read it. */
export function isConnectionString(text: string, kind: string): boolean {
  return text.trim().toLowerCase().startsWith(`${kind}+`);
}

/**
 * Takes a pasted connection string apart. It must come from `kind`: one from another product is
 * refused with a message naming both.
 */
export function parseConnectionString(text: string, kind: string): ConnectionStringDetails {
  const name = PRODUCTS[kind] ?? kind;
  const notOne = new ConnectionStringError(
    `That isn’t a connection string from ${name}. Copy it again, or enter the details instead.`,
  );
  const trimmed = text.trim();
  const plus = trimmed.indexOf('+');
  if (plus < 1) throw notOne;
  const prefix = trimmed.slice(0, plus).toLowerCase();
  if (prefix !== kind) {
    const other = PRODUCTS[prefix];
    if (other) {
      throw new ConnectionStringError(
        `That’s a connection string from ${other}. Paste one from ${name}.`,
      );
    }
    throw notOne;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(trimmed.slice(plus + 1)));
  } catch {
    throw notOne;
  }
  if (!parsed || typeof parsed !== 'object') throw notOne;
  const fields = parsed as Record<string, unknown>;
  const { url, publicKey } = fields;
  if (typeof url !== 'string' || typeof publicKey !== 'string') throw notOne;
  const details: ConnectionStringDetails = { url, publicKey };
  for (const key of SECRETS) {
    const value = fields[key];
    if (typeof value === 'string' && value) details[key] = value;
  }
  return details;
}
