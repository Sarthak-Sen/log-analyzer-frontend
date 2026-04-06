export function generateJobId(): string {
  return crypto.randomUUID()
}