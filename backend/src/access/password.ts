import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// Stand-in for a breached-password list (source to be supplied); compared case-insensitively.
const breached = new Set([
  'password1234', 'password12345', 'passwordpassword', 'qwertyuiop12', 'qwertyuiopas',
  '123456789012', '1234567890123', '111111111111', '000000000000', 'abcdefghijkl',
  'iloveyou1234', 'letmein12345', 'welcome12345', 'administrator', 'changemenow1',
  'qwerty123456', 'trustno1trustno1', 'monkeymonkey1', 'football1234', 'baseball1234',
]);

export function checkPasswordPolicy(password: string): string | null {
  const length = [...password].length;
  if (length < 12) return 'Use at least 12 characters';
  if (length > 128) return 'Use at most 128 characters';
  if (breached.has(password.toLowerCase())) return 'That password is too common';
  return null;
}

const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key))),
  );

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, key] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
