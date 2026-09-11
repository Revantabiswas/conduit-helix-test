// Client-side API helpers (Story 1.6) — thin fetch wrappers used by the auth pages.
// No axios (ARCH-06). The httpOnly session cookie rides along via credentials: 'include'.

/**
 * POST JSON to a Route Handler.
 * @param {string} path e.g. "/api/users/login"
 * @param {object} body
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
export async function apiPost(path, body) {
  return request("POST", path, body);
}

/**
 * PUT JSON to a Route Handler.
 * @param {string} path
 * @param {object} body
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
export async function apiPut(path, body) {
  return request("PUT", path, body);
}

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Normalise a Conduit error response `{ errors: { body: [...] } }` into a flat string[]
 * suitable for display on a form. Returns [] when there is nothing to show.
 * @param {any} data
 * @returns {string[]}
 */
export function normaliseErrors(data) {
  const body = data?.errors?.body;
  if (Array.isArray(body)) return body.map(String);
  return [];
}
