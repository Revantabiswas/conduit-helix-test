# Auth Pages and Session (Login, Register, Settings)

## Application Overview

Covers the UI-relevant scenarios from story 1.6's approved manual Test Plan for the Conduit app's Auth Pages and Session flows: /login, /register, /settings. Grounded in live exploration of http://localhost:3000.

Observed application facts used throughout this plan:
- Logged-out header (nav, within `navigation`): `Home`, `Sign in` (-> /login), `Sign up` (-> /register).
- Logged-in header: `Home`, `New Article` (-> /editor), `Settings` (-> /settings), `{username}` link (-> /profile/{username}). There is NO direct "Logout" nav link.
- The logout control lives on the `/settings` page only: a button named "Log out" (`getByRole('button', { name: 'Log out' })`), rendered below the settings form. Clicking it redirects to `/` and shows the logged-out header.
- Login form (`/login`): heading "Sign in", `textbox` "Email", `textbox` "Password", `button` "Sign in". On error, errors render in a `list` with accessible name "errors" containing `listitem`(s), e.g. "Wrong email/password combination". On success, redirects to `/` (away from /login) and header switches to logged-in state.
- Register form (`/register`): heading "Sign up", `textbox` "Username", `textbox` "Email", `textbox` "Password", `button` "Sign up". On error (duplicate email), the same `list` "errors" pattern shows a message like "Email already exists.. try logging in" (exact wording may vary — assert with a case-insensitive regex covering "already exist" / "taken"). On success, redirects to `/` and the header switches to logged-in state.
- Settings form (`/settings`): heading "Your Settings", `textbox` "Bio", `textbox` "Image URL", `textbox` "Email", `textbox` "New password (leave blank to keep)", `button` "Update Settings", then separately a `button` "Log out". IMPORTANT VERIFIED BEHAVIOR: the form fields are NOT pre-populated with the current user's existing bio/image/email — they always render empty regardless of login state. A successful update issues `PUT /api/user` (200) and redirects to `/`; the updated bio/image are only observably persisted by checking another page that renders them (e.g. `/profile/{username}`), NOT by re-inspecting the (always-blank) settings form.
- IMPORTANT VERIFIED BEHAVIOR: `/settings` is NOT route-guarded — navigating to it while logged out renders the same form (no redirect to /login) and the header still shows the logged-out state (Sign in / Sign up). Submitting the form while logged out calls `PUT /api/user` which returns 401, and the page shows an "errors" list item "You need to login first!"; no protected profile data is rendered. Tests must treat "protected route" expectations for /settings as: no redirect occurs, but no authenticated data is exposed and the mutating action is rejected server-side (401) — this is the ground truth to assert, not a client-side redirect.
- Auth session is a single cookie named `conduit_token` (httpOnly: true, secure: false, sameSite: Lax, domain localhost, path /). Verified: no token in localStorage or sessionStorage; `document.cookie` does not expose the token. On logout, the cookie is removed entirely from the browser context (context.cookies() returns an empty array for the app origin after logout).
- Successful registration with a brand-new unique username/email logs the user in immediately and redirects to `/` (same behavior as login).

## Test Scenarios

### 1. Login and Register

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. TC-E2E-01 - Register through the page and land logged in

**File:** `tests/e2e/auth/register.spec.ts`

**Steps:**
  1. Precondition: fresh browser context / cleared session (no cookies). Generate a unique username/email for this run, e.g. `pw_e2e_${Date.now()}` and `pw_e2e_${Date.now()}@example.com`.
  2. Navigate to /login first to establish a clean logged-out session baseline (per seed pattern), then navigate to /register.
    - expect: Page shows heading 'Sign up' and the logged-out header (Sign in / Sign up links)
  3. Fill the Username textbox with the unique username, the Email textbox with the unique email, and the Password textbox with a valid password (e.g. Passw0rd!123).
  4. Click the 'Sign up' button.
    - expect: Navigation occurs away from /register (URL no longer matches /register)
    - expect: Header switches to the logged-in affordances: 'New Article' link, 'Settings' link, and a link with the new username (instead of 'Sign in' / 'Sign up')
    - expect: No 'errors' list is present on the page

#### 1.2. TC-E2E-02 - Register rejected when username/email already taken

**File:** `tests/e2e/auth/register.spec.ts`

**Steps:**
  1. Precondition: logged out (fresh context, or navigate to /login to confirm logged-out header first).
  2. Navigate to /register.
    - expect: Heading 'Sign up' is visible
  3. Fill Username with 'playwright_fixture', Email with 'playwright_fixture@example.com', and Password with any valid-format password (e.g. SomePassw0rd!1).
  4. Click the 'Sign up' button.
    - expect: URL remains on /register (registration did not succeed)
    - expect: An 'errors' list (role list, accessible name 'errors') becomes visible containing a message indicating the account already exists (assert case-insensitively for text matching /already exist|taken/i)
    - expect: Header still shows the logged-out state (Sign in / Sign up) — no session was established
    - expect: The Username/Email/Password textboxes still contain the submitted values (form not cleared)

#### 1.3. TC-SEC-03 - Login with wrong password is rejected and creates no session

**File:** `tests/e2e/auth/login.spec.ts`

**Steps:**
  1. Precondition: logged out (fresh context).
  2. Navigate to /login.
    - expect: Heading 'Sign in' is visible
  3. Fill the Email textbox with 'playwright_fixture@example.com' and the Password textbox with 'WrongPassword!999'.
  4. Click the 'Sign in' button.
    - expect: URL remains on /login
    - expect: An 'errors' list becomes visible with a generic message (observed: 'Wrong email/password combination') — assert case-insensitively, do not depend on exact copy beyond containing 'wrong' or 'invalid' language
    - expect: Inspecting browser context cookies for the app origin shows no 'conduit_token' cookie was set (session not established)
    - expect: Header still shows the logged-out state (Sign in / Sign up)

#### 1.4. TC-A11Y-01 - Login form fully keyboard operable with logical focus order (WCAG 2.1.1, 2.4.3)

**File:** `tests/e2e/auth/login-a11y.spec.ts`

**Steps:**
  1. Precondition: logged out. Navigate to /login.
  2. Click into the page body (not into a specific field) or press Tab from a neutral start point, then repeatedly press Tab and record the sequence of focused elements until reaching the Sign in button.
    - expect: Focus order reaches the Email textbox, then the Password textbox, then the Sign in button, in that logical top-to-bottom order (nav links may precede the form in tab order but the FORM fields themselves must be in Email -> Password -> Submit order)
    - expect: No element traps focus (Tab always moves to a new element; Shift+Tab moves back)
  3. With the Email textbox focused (e.g. via Tab from page start or direct focus), type 'playwright_fixture@example.com', press Tab to move to Password, type 'Passw0rd!123'.
  4. With focus on the Sign in button (reached via Tab, not click), press Enter to submit.
    - expect: Login succeeds: URL navigates away from /login
    - expect: Header shows logged-in affordances (Settings, New Article, username link)

### 2. Settings (logged in)

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. TC-E2E-03 - Log in, update Settings, and see the change persist

**File:** `tests/e2e/auth/settings.spec.ts`

**Steps:**
  1. Precondition: log in as the fixture account (playwright_fixture@example.com / Passw0rd!123) via /login.
  2. Navigate to /settings.
    - expect: Heading 'Your Settings' is visible
    - expect: Bio, Image URL, Email, and New password textboxes are all present and reachable (form is usable; fields render empty by design in this app — do not assert pre-population)
  3. Fill the Bio textbox with 'Updated bio via E2E' and the Image URL textbox with 'https://example.com/avatar.png'. Do NOT modify the Email or New password fields (leave them blank) so the fixture account's login credentials remain unchanged.
  4. Click 'Update Settings' and wait for the network response.
    - expect: A PUT request to /api/user returns a 2xx status
    - expect: No 'errors' list is shown on the page
    - expect: Navigation redirects away from /settings (observed: to /)
  5. Navigate to /profile/playwright_fixture (the fixture account's own profile page) to verify the persisted change, since the settings form itself always renders blank.
    - expect: The profile page displays the updated bio text 'Updated bio via E2E'
  6. Navigate back to /settings and reload.
    - expect: Settings form remains usable (Bio/Image URL/Email/New password fields present, no errors), confirming the app is not left in a broken state after the update

#### 2.2. TC-E2E-04 - Settings update rejected/handled with an invalid image URL

**File:** `tests/e2e/auth/settings.spec.ts`

**Steps:**
  1. Precondition: logged in as the fixture account. Navigate to /settings.
  2. Fill the Image URL textbox with the non-URL string 'not-a-valid-url', leaving other fields blank.
  3. Click 'Update Settings' and observe the result.
    - expect: Behavior is handled predictably: EITHER a visible 'errors' list appears describing a validation failure, OR the request is accepted (2xx) and the value is stored/ignored per the API contract
    - expect: Regardless of which path is taken, the app does not crash: the page still renders the settings form afterward (Bio/Image URL/Email/New password/Update Settings all still present and interactable)
    - expect: No unhandled JavaScript exception overlay or blank page occurs
  4. Record the observed status code of the PUT /api/user request and whether an error list appeared, as evidence in the test output/comments for traceability back to TC-E2E-04.

### 3. Session and Logout

**Seed:** `tests/e2e/seed.spec.ts`

#### 3.1. TC-E2E-05 - Session persists across navigation and refresh

**File:** `tests/e2e/auth/session-persistence.spec.ts`

**Steps:**
  1. Precondition: log in as the fixture account via /login.
  2. Navigate to / (Home).
    - expect: Logged-in header affordances are visible (Settings, New Article, playwright_fixture link)
  3. Navigate to /settings.
    - expect: Settings form loads; logged-in header still visible; page is not redirected to /login
  4. Navigate back to /.
    - expect: Logged-in header affordances still visible
  5. Perform a full page reload (F5 equivalent) on / .
    - expect: Still logged in after reload: header shows Settings/New Article/username link, not Sign in/Sign up
  6. Perform a full page reload on /settings.
    - expect: Still logged in after reload: header shows logged-in affordances; settings form is present
  7. Confirm no re-login was required at any point in this flow (no navigation back to /login occurred automatically).

#### 3.2. TC-E2E-06 - Logout clears the session and produces a logged-out state

**File:** `tests/e2e/auth/logout.spec.ts`

**Steps:**
  1. Precondition: log in as the fixture account. Navigate to /settings (the page hosting the Log out control).
  2. Click the 'Log out' button.
    - expect: URL navigates to / (Home)
    - expect: Header switches to the logged-out state: 'Sign in' and 'Sign up' links are visible, 'Settings'/'New Article'/username link are gone
  3. Navigate directly to /settings.
    - expect: Header shows the logged-out state on this page too
    - expect: No authenticated profile data is displayed (form fields remain empty, no data belonging to the fixture account is shown)
    - expect: If the app attempts a mutating action while in this state it would be rejected server-side (informational — not re-tested here; covered by TC-SEC-04)

#### 3.3. TC-SEC-01 - No auth token stored in localStorage/sessionStorage (cookie-based session)

**File:** `tests/e2e/auth/session-security.spec.ts`

**Steps:**
  1. Precondition: fresh context with cleared storage and cookies. Navigate to /login and log in as the fixture account (playwright_fixture@example.com / Passw0rd!123).
  2. After successful login (URL no longer /login), evaluate window.localStorage and window.sessionStorage contents for the page.
    - expect: localStorage contains no key/value resembling an auth token, JWT, or session credential (no keys such as 'token', 'jwt', 'auth', or values matching a JWT pattern 'xxx.yyy.zzz')
    - expect: sessionStorage contains no such value either
  3. Inspect the browser context's cookies for the app origin.
    - expect: A cookie named 'conduit_token' (or equivalent session cookie) is present with a non-empty value

#### 3.4. TC-SEC-02 - Session cookie is httpOnly and not readable from JavaScript

**File:** `tests/e2e/auth/session-security.spec.ts`

**Steps:**
  1. Precondition: logged in as the fixture account.
  2. Retrieve cookies via the browser context (context.cookies()) and locate the cookie named 'conduit_token'.
    - expect: The cookie's httpOnly attribute is true
  3. Evaluate document.cookie in the page context.
    - expect: document.cookie does NOT contain the string 'conduit_token' or its token value — the cookie value is absent from JS-readable document.cookie

#### 3.5. TC-SEC-04 - Protected route /settings not reachable without a session (no data exposure)

**File:** `tests/e2e/auth/session-security.spec.ts`

**Steps:**
  1. Precondition: logged out with cookies cleared (fresh context, or explicitly clear cookies via context.clearCookies() after confirming logged-out state).
  2. Navigate directly to /settings.
    - expect: Header shows the logged-out state (Sign in / Sign up) — confirms no session exists
    - expect: Settings form fields (Bio, Image URL, Email, New password) render but are empty — no authenticated user data (e.g. fixture account's bio/email) is displayed
    - expect: Attempting to submit the form (Update Settings) results in the PUT /api/user request returning 401, with an 'errors' list showing an authentication-required message (e.g. 'You need to login first!'), confirming the mutating action is rejected server-side even though the page itself did not client-side-redirect

#### 3.6. TC-SEC-05 - Logout clears the session cookie server-side

**File:** `tests/e2e/auth/logout.spec.ts`

**Steps:**
  1. Precondition: logged in as the fixture account.
  2. Inspect context.cookies() and confirm the 'conduit_token' cookie is present; record its value.
  3. Navigate to /settings and click 'Log out'.
    - expect: Redirects to / with logged-out header
  4. Re-inspect context.cookies() for the app origin.
    - expect: The 'conduit_token' cookie is no longer present (removed / cleared), not merely emptied
  5. Navigate directly to /settings.
    - expect: Logged-out header is shown; no authenticated data is rendered (consistent with TC-SEC-04)

#### 3.7. TC-SEC-06 - Session survives refresh via the cookie, not client storage

**File:** `tests/e2e/auth/session-security.spec.ts`

**Steps:**
  1. Precondition: logged in as the fixture account.
  2. Evaluate localStorage before refresh.
    - expect: No auth token present in localStorage
  3. Confirm the 'conduit_token' session cookie exists via context.cookies().
  4. Perform a full page reload (page.reload()).
    - expect: Still logged in after reload: header shows logged-in affordances (Settings/New Article/username link)
  5. Re-evaluate localStorage after refresh.
    - expect: Still no auth token present in localStorage after the refresh (session persisted purely via the cookie)

#### 3.8. TC-SEC-07 - Injection-style input in auth fields handled safely

**File:** `tests/e2e/auth/injection-safety.spec.ts`

**Steps:**
  1. Precondition: logged out. Set up a dialog handler that records/fails the test if any JS 'alert' (or other) dialog fires during this test.
  2. Navigate to /register. Fill Username with '<script>alert(1)</script>', Email with a valid-format but unique address (e.g. 'xss_test_<unique>@example.com'), and Password with a valid password.
  3. Click 'Sign up'.
    - expect: No JavaScript alert/dialog fires at any point
    - expect: The rendered page does not execute the injected script (either the registration is rejected with a visible errors list, or it succeeds and the username is later rendered as inert text, e.g. in the header username link, never as an executed script tag)
    - expect: No raw server error / stack trace is displayed on the page
  4. Navigate to /login (ensure logged out first if the previous step logged in — log out via Settings if needed). Fill Email with "' OR '1'='1" and Password with any value (e.g. 'whatever123').
  5. Click 'Sign in'.
    - expect: Login does NOT succeed: URL remains on /login and/or an 'errors' list is shown; the SQL-injection-style probe does not bypass authentication
    - expect: No alert dialog fires
    - expect: No raw server error / stack trace is displayed on the page

### 4. Accessibility (DOM-observable)

**Seed:** `tests/e2e/seed.spec.ts`

#### 4.1. TC-A11Y-02 - All inputs expose an accessible name on /login, /register, /settings (WCAG 1.3.1, 4.1.2)

**File:** `tests/e2e/auth/a11y-names.spec.ts`

**Steps:**
  1. Precondition: logged out. Navigate to /login.
    - expect: page.getByRole('textbox', { name: 'Email' }) resolves to exactly one element
    - expect: page.getByRole('textbox', { name: 'Password' }) resolves to exactly one element
  2. Navigate to /register.
    - expect: page.getByRole('textbox', { name: 'Username' }) resolves to exactly one element
    - expect: page.getByRole('textbox', { name: 'Email' }) resolves to exactly one element
    - expect: page.getByRole('textbox', { name: 'Password' }) resolves to exactly one element
  3. Log in as the fixture account, then navigate to /settings.
    - expect: page.getByRole('textbox', { name: 'Bio' }) resolves to exactly one element
    - expect: page.getByRole('textbox', { name: 'Image URL' }) resolves to exactly one element
    - expect: page.getByRole('textbox', { name: 'Email' }) resolves to exactly one element
    - expect: No field on any of the three pages is reachable only by a non-accessible-name locator (e.g. CSS selector fallback was never required during exploration)

#### 4.2. TC-A11Y-03 - Focus is visible on every interactive control (WCAG 2.4.7)

**File:** `tests/e2e/auth/a11y-focus-visible.spec.ts`

**Steps:**
  1. Precondition: logged out. Navigate to /login.
  2. Tab sequentially through the page's interactive controls (nav links, Email, Password, Sign in button).
    - expect: After each Tab press, document.activeElement matches the expected control
    - expect: The focused element exposes a visible focus indicator: computed outline is not 'none' and outline-width is not '0px' (or an equivalent box-shadow/border focus style is present) — i.e. focus-visible styling is not suppressed globally
  3. Navigate to /register and repeat the Tab-through-and-check-focus-style check for Username, Email, Password, Sign up button.
  4. Log in as the fixture account, navigate to /settings, and repeat the Tab-through-and-check-focus-style check for Bio, Image URL, Email, New password, Update Settings, and Log out.

#### 4.3. TC-A11Y-06 - Pages usable at ~200% zoom / reflow (WCAG 1.4.4, 1.4.10)

**File:** `tests/e2e/auth/a11y-reflow.spec.ts`

**Steps:**
  1. Precondition: logged out. Set the viewport to 640x800 to approximate 200% zoom / reflow.
  2. Navigate to /login.
    - expect: Email textbox, Password textbox, and Sign in button are all visible within the viewport (or reachable via vertical scroll only)
    - expect: The form container's scrollWidth does not exceed its clientWidth beyond a small tolerance (no horizontal overflow introduced by the form itself)
  3. Navigate to /register.
    - expect: Username, Email, Password textboxes and Sign up button are all visible/operable, no horizontal overflow of the form
  4. Log in as the fixture account, navigate to /settings.
    - expect: Bio, Image URL, Email, New password textboxes, Update Settings button, and Log out button are all visible/operable, no horizontal overflow of the form
    - expect: Record (via test annotation or console note) any observed clipping of text or controls for follow-up, without failing the test solely on cosmetic clipping unless a control becomes entirely inaccessible/unclickable
