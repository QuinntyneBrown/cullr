import { newCorrelationId } from './correlation-id';
import { logError } from './error-logger';

type Handler<A extends unknown[]> = (request: Request, ...rest: A) => Promise<Response>;

export function withErrorHandling<A extends unknown[]>(handler: Handler<A>): Handler<A> {
  return async (request, ...rest) => {
    try {
      return await handler(request, ...rest);
    } catch (error) {
      const referenceId = newCorrelationId();
      logError(error, referenceId);
      return Response.json(
        { status: 500, title: 'Something went wrong', referenceId },
        { status: 500 },
      );
    }
  };
}
