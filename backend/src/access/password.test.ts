import { describe, expect, it } from 'vitest';
import { checkPasswordPolicy, hashPassword, verifyPassword } from './password';

describe('password policy (L2-046)', () => {
  it('Given a password shorter than 12 characters, When checked, Then it is rejected with the reason', () => {
    expect(checkPasswordPolicy('short-one')).toBe('Use at least 12 characters');
  });

  it('Given a commonly breached password, When checked, Then it is rejected with the reason', () => {
    expect(checkPasswordPolicy('Password1234')).toBe('That password is too common');
  });

  it('Given 12 to 128 characters of any kind including spaces, When checked, Then it is accepted', () => {
    expect(checkPasswordPolicy('correct horse battery')).toBeNull();
    expect(checkPasswordPolicy('é'.repeat(12))).toBeNull();
    expect(checkPasswordPolicy('x'.repeat(128))).toBeNull();
  });

  it('Given more than 128 characters, When checked, Then it is rejected with the reason', () => {
    expect(checkPasswordPolicy('x'.repeat(129))).toBe('Use at most 128 characters');
  });
});

describe('password hashing (L2-045)', () => {
  it('Given a password, When hashed, Then the hash is salted, does not contain the password and verifies only that password', async () => {
    const first = await hashPassword('correct horse battery');
    const second = await hashPassword('correct horse battery');

    expect(first).not.toContain('correct horse battery');
    expect(first).not.toBe(second);
    expect(await verifyPassword('correct horse battery', first)).toBe(true);
    expect(await verifyPassword('wrong horse battery', first)).toBe(false);
  });
});
