import { getTodaySummary, isCategory } from '../../../ideas/today-summary/today-summary';
import { withErrorHandling } from '../../../platform/with-error-handling';
import { withOwnerSession } from '../../../platform/with-owner-session';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(
  withOwnerSession(async (request) => {
    const category = new URL(request.url).searchParams.get('category');
    return Response.json(getTodaySummary(isCategory(category) ? category : undefined));
  }),
);
