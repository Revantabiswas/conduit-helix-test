const TYPES = ["new_article", "comment", "digest"];
const CHANNELS = ["app", "email"];

/** Everything on by default. */
export function defaultPrefs() {
  return Object.fromEntries(TYPES.map((t) => [t, Object.fromEntries(CHANNELS.map((c) => [c, true]))]));
}

export function shouldNotify(prefs, type, channel) {
  return prefs?.[type]?.[channel] !== false;
}
