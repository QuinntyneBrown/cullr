import { forbiddenOrigin, isSameOrigin } from '../../../access/origin';
import { isPeriod, PERIOD_CAPACITY } from '../../../curation/best-of-period';
import { curateIdeas } from '../../../curation/curate-idea/curate-ideas';
import { withErrorHandling } from '../../../platform/with-error-handling';
import { withOwnerSession } from '../../../platform/with-owner-session';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(
  withOwnerSession(async (request: Request) => {
    if (!isSameOrigin(request)) return forbiddenOrigin();
    const body = (await request.json().catch(() => ({}))) as { ideaIds?: unknown; period?: unknown };
    const { ideaIds, period } = body;
    if (
      !isPeriod(period) ||
      !Array.isArray(ideaIds) ||
      ideaIds.length === 0 ||
      ideaIds.length > PERIOD_CAPACITY ||
      !ideaIds.every((id) => typeof id === 'string')
    ) {
      return Response.json({ status: 400, title: 'Choose a period and up to 5 ideas' }, { status: 400 });
    }
    const result = curateIdeas(ideaIds as string[], period);
    switch (result.outcome) {
      case 'ok':
        return Response.json(result);
      case 'not-found':
        return Response.json({ status: 404, title: 'Idea not found' }, { status: 404 });
      case 'archived':
        return Response.json({ status: 422, title: 'Archived ideas cannot be curated', reason: 'archived' }, { status: 422 });
    }
  }),
);
