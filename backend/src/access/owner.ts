import { randomUUID } from 'node:crypto';
import { openDatabase } from '../db/database.ts';
import { hashPassword } from './password.ts';

export async function createOwner(email: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  const db = openDatabase();
  try {
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      randomUUID(),
      email.trim().toLowerCase(),
      passwordHash,
    );
  } finally {
    db.close();
  }
}
