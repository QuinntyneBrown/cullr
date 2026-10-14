import { createOwner } from './owner';
import { POST as signIn } from '../app/api/auth/sign-in/route';

const PASSWORD = 'correct horse battery';

export async function signedInCookie(): Promise<string> {
  await createOwner('owner@cullr.app', PASSWORD);
  const res = await signIn(
    new Request('http://localhost/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner@cullr.app', password: PASSWORD }),
    }),
  );
  return res.headers.get('set-cookie')!.split(';')[0];
}
