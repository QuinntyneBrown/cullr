import { databaseAnswers } from '../../../db/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const database = databaseAnswers() ? 'up' : 'down';
  return Response.json(
    { service: 'up', database },
    { status: database === 'up' ? 200 : 503 },
  );
}
