import { isSameOrigin, forbiddenOrigin } from '../../../access/origin';
import { listIdeas, parseCriteria } from '../../../ideas/browse-ideas/list-ideas';
import { captureIdea } from '../../../ideas/capture-idea/capture-idea';
import { withErrorHandling } from '../../../platform/with-error-handling';
import { withOwnerSession } from '../../../platform/with-owner-session';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(
  withOwnerSession(async (request) =>
    Response.json(listIdeas(parseCriteria(new URL(request.url).searchParams))),
  ),
);

export const POST = withErrorHandling(
  withOwnerSession(async (request) => {
    if (!isSameOrigin(request)) return forbiddenOrigin();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const result = captureIdea(body);
    if (result.outcome === 'invalid') {
      return Response.json({ status: 400, title: 'Check the form', errors: result.errors }, { status: 400 });
    }
    return Response.json(result.idea, { status: result.outcome === 'created' ? 201 : 200 });
  }),
);
