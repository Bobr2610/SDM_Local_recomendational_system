/** Split a CSS linear-gradient into [start, end] hex colors for LinearGradient. */
export function parseGradientStops(css: string): [string, string] {
  const hex = css.match(/#[0-9a-fA-F]{3,8}/g)
  if (hex && hex.length >= 2) return [hex[0], hex[1]]
  if (hex && hex.length === 1) return [hex[0], hex[0]]
  return ['#eef2fc', '#e8f0fe']
}
