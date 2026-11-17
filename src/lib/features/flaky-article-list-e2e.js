/** True once the last `needed` samples of the list length agree (pagination has settled). */
export function isPaginationStable(samples, needed = 3) {
  if (samples.length < needed) return false;
  const tail = samples.slice(-needed);
  return tail.every((n) => n === tail[0]);
}
