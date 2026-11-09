import type { ConnectionDetails } from './integrations.js';

/** The products a connection string can come from, by their prefix. */
const PRODUCTS: Record<string, string> = {
  openversion: 'OpenVersion',
  openannounce: 'OpenAnnounce',
};

/** A connection string that can't be used here, with a message to show as is. */
export class ConnectionStringError extends Error {}

/**
 * Packs a connection into one value to paste: `openversion+<base64url of JSON>`. It holds the
 * secret when one is given, so treat it as a secret: show it once, in the secret dialog.
 */
export function makeConnectionString(kind: string, details: ConnectionDetails): string {
  const body: ConnectionDetails = { url: details.url, publicKey: details.publicKey };
  if (details.deployToken) body.deployToken = details.deployToken;
  if (details.signingSecret) body.signingSecret = details.signingSecret;
  return `${kind}+${Buffer.from(JSON.stringify(body)).toString('base64url')}`;
}

/**
 * Takes a pasted connection string apart. It must come from `kind`: one from another product is
 * refused with a message naming both.
 */
export function parseConnectionString(text: string, kind: string): ConnectionDetails {
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
    parsed = JSON.parse(Buffer.from(trimmed.slice(plus + 1), 'base64url').toString('utf8'));
  } catch {
    throw notOne;
  }
  if (!parsed || typeof parsed !== 'object') throw notOne;
  const { url, publicKey, deployToken, signingSecret } = parsed as Record<string, unknown>;
  if (typeof url !== 'string' || typeof publicKey !== 'string') throw notOne;
  const details: ConnectionDetails = { url, publicKey };
  if (typeof deployToken === 'string' && deployToken) details.deployToken = deployToken;
  if (typeof signingSecret === 'string' && signingSecret) details.signingSecret = signingSecret;
  return details;
}
