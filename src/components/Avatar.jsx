// Avatar (ported from frontend/src/components/Avatar). Presentational.
// Uses a plain src fallback (the legacy imported a bundled image asset; here we accept a
// src or fall back to a neutral placeholder path served from /public if present).

export default function Avatar({ alt, className, src }) {
  return (
    <img
      alt={alt || "placeholder"}
      className={className || ""}
      src={src || "/images/smiley-cyrus.jpeg"}
    />
  );
}
