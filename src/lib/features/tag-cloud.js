/** Font size (px) for a tag, scaled linearly between min and max by its count. */
export function tagFontSize(count, { min = 12, max = 28, lo = 1, hi = 50 } = {}) {
  if (hi <= lo) return min;
  const t = Math.min(1, Math.max(0, (count - lo) / (hi - lo)));
  return Math.round(min + t * (max - min));
}
