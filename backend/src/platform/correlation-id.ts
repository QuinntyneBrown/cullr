export function newCorrelationId(): string {
  return crypto.randomUUID();
}
