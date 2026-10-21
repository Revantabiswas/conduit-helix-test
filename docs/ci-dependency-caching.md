# CI dependency caching (KAN-20)

Cache `node_modules` (keyed on `package-lock.json`) and the Next.js build cache (`.next/cache`) to cut CI time.

## Cache keys
- `node_modules`: `hash(package-lock.json)`
- `.next/cache`: `hash(package-lock.json) + hash(src/**)`

## Expectations
- Cold run unchanged; warm run skips `npm ci` when the lockfile is unchanged.
- Invalidate by editing the lockfile or bumping the key prefix.
