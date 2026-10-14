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
