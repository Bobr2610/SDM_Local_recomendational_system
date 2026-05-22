let id = 0
export function generateSessionId(): string {
  id++
  return `sess-${Date.now()}-${id}-${Math.random().toString(36).slice(2, 8)}`
}
