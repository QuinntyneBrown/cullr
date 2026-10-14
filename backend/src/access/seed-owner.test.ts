import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../db/database';
import { seedOwner } from './seed-owner';
import { useTestDatabase } from './test-database';

beforeEach(useTestDatabase);

const users = () => {
  const db = openDatabase();
  const rows = db.prepare('SELECT email, password_hash FROM users').all() as {
    email: string;
    password_hash: string;
  }[];
  db.close();
  return rows;
};

describe('seed-owner', () => {
  it('Given an email and a policy-compliant password, When seeded, Then the owner exists with a hashed password', async () => {
    await seedOwner('Owner@Cullr.app', 'correct horse battery');

    const [owner] = users();
    expect(owner.email).toBe('owner@cullr.app');
    expect(owner.password_hash).not.toContain('correct horse battery');
  });

  it('Given a password that breaks the policy, When seeded, Then it is rejected with the reason and no owner is created', async () => {
    await expect(seedOwner('owner@cullr.app', 'short')).rejects.toThrow('Use at least 12 characters');

    expect(users()).toHaveLength(0);
  });

  it('Given a missing email, When seeded, Then it is rejected', async () => {
    await expect(seedOwner('', 'correct horse battery')).rejects.toThrow('CULLR_OWNER_EMAIL');
  });

  it('Given an owner already exists, When seeded again, Then it is rejected and nothing changes', async () => {
    await seedOwner('owner@cullr.app', 'correct horse battery');

    await expect(seedOwner('other@cullr.app', 'another good passphrase')).rejects.toThrow('already exists');

    expect(users()).toHaveLength(1);
  });
});
