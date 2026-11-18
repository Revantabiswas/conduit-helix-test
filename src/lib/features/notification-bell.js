/** Label for the bell badge: hidden at zero, capped at 9+. */
export function badgeLabel(unread) {
  if (!unread || unread < 1) return "";
  return unread > 9 ? "9+" : String(unread);
}
