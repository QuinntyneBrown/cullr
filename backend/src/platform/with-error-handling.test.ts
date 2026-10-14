import { afterEach, describe, expect, it, vi } from 'vitest';
import { withErrorHandling } from './with-error-handling';

afterEach(() => vi.restoreAllMocks());

describe('withErrorHandling', () => {
  it('Given a handler fails unexpectedly, When called, Then the log line and the response share one correlation id and the response hides internals', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withErrorHandling(async () => {
      throw new Error('secret table cullr_ideas exploded');
    });

    const res = await handler(new Request('http://localhost/api/x'));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.referenceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(body)).not.toContain('exploded');
    expect(JSON.stringify(body)).not.toContain('Error:');
    const line = JSON.parse(log.mock.calls[0][0] as string);
    expect(line.correlationId).toBe(body.referenceId);
  });

  it('Given a handler succeeds, When called, Then its response is returned unchanged and nothing is logged', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withErrorHandling(async () => Response.json({ ok: true }, { status: 201 }));

    const res = await handler(new Request('http://localhost/api/x'));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(log).not.toHaveBeenCalled();
  });
});
