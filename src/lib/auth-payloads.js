// Pure payload builders for the auth forms (Story 1.6). Extracted from the page
// components so the request-shaping logic is unit-testable without rendering React.
// Every builder produces the Conduit `{ user: {...} }` request shape.

/**
 * @param {{email:string, password:string}} form
 * @returns {{ user: { email:string, password:string } }}
 */
export function buildLoginPayload({ email, password }) {
  return { user: { email, password } };
}

/**
 * @param {{username:string, email:string, password:string}} form
 * @returns {{ user: { username:string, email:string, password:string } }}
 */
export function buildRegisterPayload({ username, email, password }) {
  return { user: { username, email, password } };
}

/**
 * Build a settings update payload, omitting any field left blank (notably: a blank
 * password is never sent, so it is not re-hashed to an empty value).
 * @param {{email?:string, username?:string, bio?:string, image?:string, password?:string}} form
 * @returns {{ user: object }}
 */
export function buildSettingsPayload(form) {
  const user = {};
  for (const key of ["email", "username", "bio", "image"]) {
    if (form[key] !== undefined && form[key] !== "") user[key] = form[key];
  }
  if (form.password) user.password = form.password;
  return { user };
}
