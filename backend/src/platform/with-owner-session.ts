import { readSession } from '../access/session';

export type OwnerSession = { ownerId: string };
export type SessionReader = (request: Request) => Promise<OwnerSession | null>;

type Handler<A extends unknown[]> = (request: Request, ...rest: A) => Promise<Response>;

export function withOwnerSession<A extends unknown[]>(
  handler: Handler<A>,
  reader: SessionReader = readSession,
): Handler<A> {
  return async (request, ...rest) => {
    if (!(await reader(request))) {
      return Response.json({ status: 401, title: 'Sign in required' }, { status: 401 });
    }
    return handler(request, ...rest);
  };
}
