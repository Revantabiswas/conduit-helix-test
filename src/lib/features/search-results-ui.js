/** Split text into highlighted and plain segments for the results list. */
export function highlight(text, q) {
  const query = String(q || "").trim();
  if (!query) return [{ text: String(text), match: false }];
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  return String(text).split(re).filter(Boolean).map((part) => ({ text: part, match: part.toLowerCase() === query.toLowerCase() }));
}
