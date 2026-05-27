/** Public model asset URLs under /model/. */
export function modelAssetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = relativePath.replace(/^\//, '')
  return `${base}${normalized}`
}
