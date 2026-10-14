export type OwnerSession = { ownerId: string };
export type SessionReader = (request: Request) => Promise<OwnerSession | null>;

// Sessions arrive in a later slice; until then no request has one.
const noSession: SessionReader = async () => null;

type Handler<A extends unknown[]> = (request: Request, ...rest: A) => Promise<Response>;

export function withOwnerSession<A extends unknown[]>(
  handler: Handler<A>,
  readSession: SessionReader = noSession,
): Handler<A> {
  return async (request, ...rest) => {
    if (!(await readSession(request))) {
      return Response.json({ status: 401, title: 'Sign in required' }, { status: 401 });
    }
    return handler(request, ...rest);
  };
}
