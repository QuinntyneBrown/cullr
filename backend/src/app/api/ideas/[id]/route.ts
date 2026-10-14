import { forbiddenOrigin, isSameOrigin } from '../../../../access/origin';
import { editIdea } from '../../../../ideas/edit-idea/edit-idea';
import { getIdea } from '../../../../ideas/view-idea/get-idea';
import { withErrorHandling } from '../../../../platform/with-error-handling';
import { withOwnerSession } from '../../../../platform/with-owner-session';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(
  withOwnerSession(async (_request: Request, { params }: Context) => {
    const idea = getIdea((await params).id);
    return idea ? Response.json(idea) : Response.json({ status: 404, title: 'Idea not found' }, { status: 404 });
  }),
);

export const PUT = withErrorHandling(
  withOwnerSession(async (request: Request, { params }: Context) => {
    if (!isSameOrigin(request)) return forbiddenOrigin();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const result = editIdea((await params).id, body);
    switch (result.outcome) {
      case 'updated':
        return Response.json(result.idea);
      case 'invalid':
        return Response.json({ status: 400, title: 'Check the form', errors: result.errors }, { status: 400 });
      case 'not-found':
        return Response.json({ status: 404, title: 'Idea not found' }, { status: 404 });
      case 'archived':
        return Response.json({ status: 422, title: 'Archived ideas cannot be edited', reason: 'archived' }, { status: 422 });
      case 'changed':
        return Response.json({ status: 409, title: 'Idea changed', reason: 'changed', current: result.current }, { status: 409 });
    }
  }),
);
