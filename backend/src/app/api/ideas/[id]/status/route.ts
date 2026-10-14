import { forbiddenOrigin, isSameOrigin } from '../../../../../access/origin';
import { setIdeaStatus } from '../../../../../ideas/idea-status/set-idea-status';
import { withErrorHandling } from '../../../../../platform/with-error-handling';
import { withOwnerSession } from '../../../../../platform/with-owner-session';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PUT = withErrorHandling(
  withOwnerSession(async (request: Request, { params }: Context) => {
    if (!isSameOrigin(request)) return forbiddenOrigin();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const result = setIdeaStatus((await params).id, body.status);
    switch (result.outcome) {
      case 'ok':
        return Response.json(result.idea);
      case 'invalid':
        return Response.json({ status: 400, title: 'Choose Building or Built' }, { status: 400 });
      case 'not-found':
        return Response.json({ status: 404, title: 'Idea not found' }, { status: 404 });
      case 'archived':
        return Response.json({ status: 422, title: 'Archived ideas cannot change status', reason: 'archived' }, { status: 422 });
    }
  }),
);
