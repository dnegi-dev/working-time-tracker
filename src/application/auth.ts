/** Hash of "admin:admin". Override at build time with VITE_LOGIN_HASH (sha256 hex of "user:pass"). */
export const DEFAULT_LOGIN_HASH =
  '8da193366e1554c08b2870c50f737b9587c3372b656151c4a96028af26f51334';

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Client-side gate only: keeps casual visitors out, it is not security. */
export async function checkLogin(
  user: string,
  pass: string,
  expectedHash: string,
): Promise<boolean> {
  return (await sha256Hex(`${user}:${pass}`)) === expectedHash;
}
