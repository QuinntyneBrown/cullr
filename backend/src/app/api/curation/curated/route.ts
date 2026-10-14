import { getCurated } from '../../../../curation/view-curated/get-curated';
import { withErrorHandling } from '../../../../platform/with-error-handling';
import { withOwnerSession } from '../../../../platform/with-owner-session';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(withOwnerSession(async () => Response.json(getCurated())));
