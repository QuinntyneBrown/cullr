export function logError(error: unknown, correlationId: string): void {
  const name = error instanceof Error ? error.name : 'UnknownError';
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(JSON.stringify({ level: 'error', correlationId, name, stack }));
}
