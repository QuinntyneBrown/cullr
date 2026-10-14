import { openDatabase } from '../db/database';
import { createOwner } from './owner';
import { checkPasswordPolicy } from './password';

export async function seedOwner(email: string | undefined, password: string | undefined): Promise<void> {
  if (!email?.trim()) throw new Error('CULLR_OWNER_EMAIL is required');
  if (!password) throw new Error('CULLR_OWNER_PASSWORD is required');
  const reason = checkPasswordPolicy(password);
  if (reason) throw new Error(reason);

  const db = openDatabase();
  const { n } = db.prepare('SELECT count(*) AS n FROM users').get() as { n: number };
  db.close();
  if (n > 0) throw new Error('The owner already exists');

  await createOwner(email, password);
}

if (process.argv[1]?.endsWith('seed-owner.ts')) {
  seedOwner(process.env.CULLR_OWNER_EMAIL, process.env.CULLR_OWNER_PASSWORD).then(
    () => console.log('Owner created'),
    (error: Error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
