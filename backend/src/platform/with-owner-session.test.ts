import { describe, expect, it } from 'vitest';
import { withOwnerSession } from './with-owner-session';

const request = new Request('http://localhost/api/ideas');

describe('withOwnerSession', () => {
  it('Given no valid session, When an endpoint is called, Then 401 is returned and the handler does not run', async () => {
    let ran = false;
    const handler = withOwnerSession(
      async () => {
        ran = true;
        return Response.json({});
      },
      async () => null,
    );

    const res = await handler(request);

    expect(res.status).toBe(401);
    expect(ran).toBe(false);
  });

  it('Given a valid owner session, When an endpoint is called, Then the handler runs', async () => {
    const handler = withOwnerSession(
      async () => Response.json({ ok: true }),
      async () => ({ ownerId: 'owner' }),
    );

    const res = await handler(request);

    expect(res.status).toBe(200);
  });

  it('Given no reader is injected, When a request without a session cookie arrives, Then 401 is returned', async () => {
    const res = await withOwnerSession(async () => Response.json({}))(request);

    expect(res.status).toBe(401);
  });
});
