# Home & Article Pages (Server Components) — Story 1.7

## Application Overview

Test plan for the Conduit home feed (`/`) and article detail (`/article/[slug]`) pages, both implemented as Next.js Server Components. Grounded via live exploration of http://localhost:3000 against seeded fixture data (author `pw_author2` with 15 `pwtag` articles incl. `pw-markdown-rich`; follower `pw_bob2` who follows `pw_author2` and favorited `pw-markdown-rich`).

**Discovered facts that ground every scenario below (do not invent selectors/params beyond these):**
- Feed toggle is a real navigation, not a client-side tab: anonymous users see only a "Global Feed" link (`href="/"`, class `nav-link active`). Logged-in users additionally see "Your Feed" (`href="/?feed=personal"`). The **personal-feed search param is `feed=personal`**; removing it (navigating to `/`) restores the global feed. The active tab carries CSS class `nav-link active`; the inactive tab carries `nav-link ` (no `active`).
- **Tag filter param is `tag`**, e.g. `/?tag=pwtag`. Tag links live in the "Popular Tags" sidebar (`/?tag=intro`, `/?tag=nextjs`, `/?tag=pwtag`, `/?tag=markdown`) — confirmed tags present in seed data. There is no visible "active tag" tab/pill anywhere in the UI once a tag is applied (the feed-toggle list still only shows Global Feed / Your Feed) — this is expected app behavior, not a defect to test against.
- **Pagination param is `page` (1-indexed), NOT `offset`.** `?offset=10` was verified live to have NO effect (identical results to page 1) — `offset` is not wired up in this build. `?page=2` was verified live to correctly return the next slice (the remaining 5 of 15 `pwtag` articles: `pw-seed-article-4/3/2/1`, `pw-cookie-test`). Page size is 10.
- **There is NO visible pagination UI control** (no "1 2 3" links/buttons) anywhere in the DOM on either the global or tag-filtered feed — pagination is a pure URL/search-param mechanism only, not a rendered widget. Plan items describing "a pagination control" are grounded to mean "the `page` param changes the rendered article set," not a clickable page-number widget.
- Article previews: each is an `<a href="/article/{slug}">` wrapping an `<h1>` (article title), summary paragraph, "Read more...", and a tag list. Every preview's title is an `<h1>` — i.e. the feed page renders MULTIPLE `<h1>` elements (one per preview card), a real heading-structure characteristic to assert on, not assume single-h1.
- `/article/pw-markdown-rich` renders the markdown body as formatted HTML: `<h1>Heading</h1>`, `<strong>bold</strong> text`, a `<ul>`/`<li>` list (`item one`, `item two`), and a `<code>` block (`const x = 1;`). Below the body, 2 seeded comments render as plain paragraphs with author name + date (no comment IDs/timestligible from ARIA roles beyond text).
- **There are NO favorite/follow interactive controls and NO comment-post form anywhere on `/article/[slug]` in this build** — `document.querySelectorAll('button')` returns an empty array, and body text contains neither "Favorite" nor "Follow", for both anonymous and logged-in (`pw_bob2`) sessions. This is the actual, grounded state of the Server-Component article page — session-scoped safety is verified by confirming NO such affordance leaks another user's state (not by inspecting a toggled boolean on a button that doesn't exist).
- All `<img>` elements found (author avatars) carry a non-null `alt` attribute (e.g. `alt="pw_author2"`).
- Navigating to `/article/nonexistent-slug-xyz-000` returns **HTTP 200** (not a 404 status) but renders a dedicated not-found UI: `<main><h1>Article not found</h1></main>` — no stack trace, no 500.
- Malicious/garbage `tag`/`page` values (`tag=<script>alert(1)</script>`, `page=-5`, `page=99999`) render gracefully with body text "No articles available." — no dialog fires, no crash, no raw server error.
- Tab-focused elements show a visible focus outline (`outline: auto 5px`, i.e. the UA default focus ring is not suppressed) on nav/article/tag links.
- At viewport 640x800, `document.documentElement.scrollWidth === clientWidth` (640) on both `/` and `/article/pw-markdown-rich` — no horizontal overflow.
- No console messages matching `/hydrat/i` or `/did not match/i` were observed loading `/` (anonymous and as `pw_bob2`) or `/article/pw-markdown-rich`. A benign, unrelated 404 for `/images/smiley-cyrus.jpeg` (placeholder avatar image) and a CSS-preload warning are present on every page load — expected noise, not to be confused with hydration errors.
- Login: `/login` has `Email`/`Password` textboxes (`getByRole('textbox', {name: /email/i}))/(/password/i)`) and a `Sign in` button; successful login redirects off `/login` and the nav switches to `New Article` / `Settings` / `{username}` links.

## Test Scenarios

### 1. Home Feed & Navigation

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. TC-E2E-01 — Anonymous visitor lands on home, sees global feed + popular-tags sidebar + pagination

**File:** `tests/playwright-specs/home-article/tc-e2e-01-anonymous-home.spec.ts`

**Steps:**
  1. Start a fresh (anonymous) browser context and navigate to http://localhost:3000/
    - expect: The navigation response status is 200
  2. Assert the header nav shows 'Sign in' and 'Sign up' links (and no 'New Article'/'Settings'/username link)
    - expect: Anonymous header state is shown
  3. Assert a list of article preview cards is rendered — each is a link to /article/{slug} containing an h1 title, an author link to /profile/{author}, a date, and a tag list
    - expect: At least 1 article preview card renders; exactly 10 are present (page size)
  4. Assert the 'Popular Tags' sidebar is rendered with a list of tag links, including a link with href=/?tag=pwtag and visible text 'pwtag'
    - expect: Popular Tags sidebar lists intro, nextjs, pwtag, markdown
  5. Assert the feed toggle shows only a 'Global Feed' link (href="/") carrying class 'nav-link active' — no 'Your Feed' link is present for an anonymous user
    - expect: Global feed toggle is present and marked active via its 'active' CSS class
  6. Navigate to http://localhost:3000/?page=2 and assert the rendered article slugs differ from the page-1 set (confirms >10 articles exist / pagination via the page param works)
    - expect: Page 2 renders a different set of article slugs than page 1

#### 1.2. TC-E2E-02 — Logged-in user sees personal feed via URL, then switches to global via navigation

**File:** `tests/playwright-specs/home-article/tc-e2e-02-personal-vs-global-feed.spec.ts`

**Steps:**
  1. Log in as pw_bob2 (pw_bob2@example.com / Passw0rd!123) via /login, landing back on /
    - expect: Login succeeds; nav shows 'New Article', 'Settings', 'pw_bob2' links; URL is not /login
  2. On /, assert the feed toggle shows both 'Your Feed' (href=/?feed=personal) and 'Global Feed' (href=/), with 'Global Feed' carrying class 'nav-link active'
    - expect: Global Feed is the default active tab for a fresh navigation to /
  3. Click 'Your Feed'
    - expect: URL becomes http://localhost:3000/?feed=personal
    - expect: 'Your Feed' link now carries class 'nav-link active'; 'Global Feed' loses the 'active' class
  4. Read the rendered article preview list
    - expect: All 10 articles shown are authored by pw_author2 (the followed author) — i.e. the personal feed is scoped to followed authors' pwtag articles, not the full ~16-article global set
  5. Click 'Global Feed'
    - expect: URL returns to http://localhost:3000/ (no feed param)
    - expect: 'Global Feed' carries class 'nav-link active' again; the feed re-renders to include articles from authors beyond pw_author2 alone (the full global set)
  6. Reload directly at http://localhost:3000/?feed=personal (cold navigation, no prior click)
    - expect: The personal feed renders identically to the clicked-through version — the URL alone reconstructs the feed (bookmarkable)

#### 1.3. TC-E2E-03 — Filter feed by tag via URL, then open an article and read body + comments

**File:** `tests/playwright-specs/home-article/tc-e2e-03-tag-filter-and-article-read.spec.ts`

**Steps:**
  1. Anonymous context, navigate to /, then click the 'pwtag' link in the Popular Tags sidebar
    - expect: URL becomes http://localhost:3000/?tag=pwtag
  2. Read the rendered article preview list
    - expect: All 10 article previews shown carry the 'pwtag' tag in their tag list (tag-filtered feed, not the unfiltered global set)
  3. Click the 'PW Markdown Rich' article preview link (or navigate directly to /article/pw-markdown-rich)
    - expect: Navigates to http://localhost:3000/article/pw-markdown-rich
  4. Inspect the rendered article body DOM
    - expect: An <h1>Heading</h1> is rendered (not the raw text '# Heading')
    - expect: A <strong>bold</strong> inline element is rendered adjacent to plain text 'text' (not raw '**bold**')
    - expect: A <ul> containing <li>item one</li> and <li>item two</li> is rendered (not raw '- item one')
    - expect: A <code> element containing 'const x = 1;' is rendered (not a raw markdown fence)
  5. Inspect the comments section below the article body
    - expect: Exactly 2 comments render, with visible text 'Second comment here' and 'First comment on rich article', each attributed to author pw_author2 with a date

#### 1.4. TC-E2E-04 — Open a non-existent article slug: graceful not-found, not a crash

**File:** `tests/playwright-specs/home-article/tc-e2e-04-article-not-found.spec.ts`

**Steps:**
  1. Anonymous context, navigate to http://localhost:3000/article/nonexistent-slug-xyz-000
    - expect: Navigation completes without a network-level failure
  2. Inspect the rendered page
    - expect: A <main> region containing an <h1>Article not found</h1> is rendered
    - expect: No text matching a raw stack trace, 'Internal Server Error', or a Next.js dev error overlay is present in the page
  3. Record the HTTP response status of the navigation
    - expect: Status is observed and asserted consistently with the app's actual behavior (200 with not-found UI, per current build) — the assertion targets the not-found UI being shown regardless of the exact status code, since Next.js server components may return 200 for a rendered not-found boundary

#### 1.5. TC-E2E-05 — Deep-link directly to a tag+pagination URL reproduces the exact feed on cold load

**File:** `tests/playwright-specs/home-article/tc-e2e-05-deep-link-tag-pagination.spec.ts`

**Steps:**
  1. In a brand-new browser context (no prior navigation in this context), navigate directly to http://localhost:3000/?tag=pwtag&page=2
    - expect: Page loads successfully (cold load) with the URL preserved
  2. Inspect the rendered article preview list
    - expect: Exactly 5 articles render: pw-seed-article-4, pw-seed-article-3, pw-seed-article-2, pw-seed-article-1, pw-cookie-test (the remaining 5 of the 15 pwtag articles after a 10-per-page first page)
    - expect: None of the page-1 slugs (pw-markdown-rich, pw-seed-article-13..5) are present, confirming this is a distinct page, not a repeat of page 1
  3. Compare against a separate cold navigation to http://localhost:3000/?tag=pwtag (implicit page 1)
    - expect: The page-1 set and the page-2 set are disjoint — the URL alone (tag + page) fully reconstructs the correct feed slice with no client-side-only state required

### 2. Session-Scoped Rendering (Browser-Observable Security)

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. TC-SEC-02 — Anonymous visitor is treated as unauthenticated (no session-specific state leaks)

**File:** `tests/playwright-specs/home-article/tc-sec-02-anonymous-session-isolation.spec.ts`

**Steps:**
  1. In a fresh anonymous context, navigate to http://localhost:3000/
    - expect: Header nav shows 'Sign in' and 'Sign up' links only — no 'New Article', 'Settings', or any username link
  2. On the same anonymous context, navigate to http://localhost:3000/article/pw-markdown-rich (an article Bob favorited)
    - expect: Header nav still shows 'Sign in'/'Sign up' (anonymous state, unaffected by any other user's session)
    - expect: No favorite-count, favorited-state, following-state or any per-user interactive control referencing Bob's account is present in the DOM (this build renders no favorite/follow buttons at all on this page — assert the DOM contains zero <button> elements and body text contains neither 'Favorite' nor 'Follow', confirming no session state of any kind, Bob's or otherwise, leaks into the anonymous render)
  3. Assert the article body and comments (public data) render identically to the logged-in view captured in TC-E2E-03 — heading, bold, list, code block, and the same 2 comments
    - expect: Public content is unaffected by auth state; only session-scoped chrome (header links) differs between anonymous and logged-in

#### 2.2. TC-SEC-04 — Tag/page search params handled safely (injection-style input)

**File:** `tests/playwright-specs/home-article/tc-sec-04-malicious-query-params.spec.ts`

**Steps:**
  1. Register a page 'dialog' event handler that fails the test immediately if any alert/confirm/prompt dialog fires
    - expect: Handler is armed before navigation
  2. Navigate to http://localhost:3000/?tag=%3Cscript%3Ealert(1)%3C%2Fscript%3E&page=-5
    - expect: No dialog fires
    - expect: Page renders without a crash: body text includes 'No articles available.' (graceful empty state)
    - expect: No raw server error / stack trace text is present in the page
  3. Navigate to http://localhost:3000/?tag=pwtag&page=99999 (valid tag, out-of-range page)
    - expect: No dialog fires
    - expect: Page renders without a crash: body text includes 'No articles available.' for the out-of-range page
    - expect: No raw server error / stack trace text is present in the page
    - expect: The Popular Tags sidebar and nav remain intact (page did not 500)

### 3. Accessibility (DOM-Observable)

**Seed:** `tests/e2e/seed.spec.ts`

#### 3.1. TC-A11Y-01 — Home page keyboard-only navigation reaches interactive elements in a sensible order

**File:** `tests/playwright-specs/home-article/tc-a11y-01-home-keyboard-nav.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/ (logged in as pw_bob2, to exercise both feed toggles) and press Tab repeatedly (at least 15 times, covering nav brand, Home, New Article, Settings, username, Your Feed, Global Feed, each article preview's avatar link + title link, and the Popular Tags links)
    - expect: Each Tab press moves document.activeElement to a distinct, visible, interactive element (a or button) — never stuck on the same element twice in a row, never silently thrown to document.body
  2. Continue tabbing through all article preview links and into the Popular Tags sidebar links
    - expect: Focus reaches every tag link (intro, nextjs, pwtag, markdown) by keyboard alone
    - expect: No focus trap is observed: tabbing does not cycle back to the top of the page before reaching the tags sidebar
  3. Press Shift+Tab from the last focused element
    - expect: Focus moves backward to the previously-focused element, confirming a working, non-trapped tab order in both directions

#### 3.2. TC-A11Y-02 — Home page visible focus indicator on links and tags

**File:** `tests/playwright-specs/home-article/tc-a11y-02-focus-indicator.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/ and Tab to the first article preview title link
    - expect: document.activeElement is the expected link
  2. Read getComputedStyle(document.activeElement) for outlineStyle/outlineWidth and boxShadow
    - expect: Either outlineStyle is not 'none' and outlineWidth is not '0px', OR boxShadow is not 'none' — i.e. a visible focus indicator is present. (Observed baseline: outline 'auto 5px'.) If focus is suppressed with no alternative indicator, assert against it as a defect — do not weaken the assertion
  3. Repeat the same getComputedStyle check after tabbing to a Popular Tags sidebar link (e.g. the 'pwtag' link)
    - expect: The tag link also shows a visible focus indicator by the same outline-or-box-shadow check

#### 3.3. TC-A11Y-03 — Home page heading structure is present and hierarchical

**File:** `tests/playwright-specs/home-article/tc-a11y-03-heading-structure.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/ and use getByRole('heading') to enumerate all headings with their levels
    - expect: At least one heading is present on the page
  2. Read the sequence of heading levels encountered in DOM order
    - expect: No heading level is skipped going deeper (e.g. no h3 appearing before any h2 has appeared in the hierarchy) — note the observed baseline is a flat sequence of h1 elements (one per article preview card, e.g. 'PW Markdown Rich', 'PW Seed Article 13', ...), which is a valid non-skipping (flat) structure; assert the no-skip invariant generically rather than hardcoding a single expected h1

#### 3.4. TC-A11Y-05 — Article page: author avatar images have alt text

**File:** `tests/playwright-specs/home-article/tc-a11y-05-image-alt-text.spec.ts`

**Steps:**
  1. Navigate to http://localhost:3000/article/pw-markdown-rich
    - expect: Page loads
  2. Query all <img> elements on the page and check each for a present 'alt' attribute (hasAttribute('alt'), allowing an empty string for decorative images)
    - expect: Every <img> on the page (observed: 3 author-avatar images, all with alt='pw_author2') has an alt attribute present — zero images are missing the alt attribute entirely

#### 3.5. TC-A11Y-07 — Both pages reflow at ~200% zoom (640x800 viewport) with no horizontal overflow

**File:** `tests/playwright-specs/home-article/tc-a11y-07-reflow-640-viewport.spec.ts`

**Steps:**
  1. Set viewport to 640x800 and navigate to http://localhost:3000/
    - expect: Key content (nav, at least one article preview, Popular Tags sidebar) remains visible and operable
    - expect: document.documentElement.scrollWidth <= document.documentElement.clientWidth + small tolerance (e.g. 1-2px) — no horizontal overflow (observed baseline: 640 === 640)
  2. At the same 640x800 viewport, navigate to http://localhost:3000/article/pw-markdown-rich
    - expect: Key content (article title, body with heading/bold/list/code, comments) remains visible and operable
    - expect: document.documentElement.scrollWidth <= document.documentElement.clientWidth + small tolerance — no horizontal overflow (observed baseline: 640 === 640)

### 4. Hydration Correctness

**Seed:** `tests/e2e/seed.spec.ts`

#### 4.1. TC-PERF-03 — Both pages render with zero hydration errors in the browser console

**File:** `tests/playwright-specs/home-article/tc-perf-03-zero-hydration-errors.spec.ts`

**Steps:**
  1. Register a console-message listener before navigation. In an anonymous context, navigate to http://localhost:3000/ and wait briefly for hydration to settle
    - expect: No console message text matches /hydrat/i or /did not match/i or /Hydration failed/i
  2. Log in as pw_bob2 and navigate to http://localhost:3000/ again (logged-in render, including the 'Your Feed'/'Global Feed' toggle and extra nav links)
    - expect: No console message text matches /hydrat/i or /did not match/i or /Hydration failed/i
  3. Navigate to http://localhost:3000/article/pw-markdown-rich (still logged in)
    - expect: No console message text matches /hydrat/i or /did not match/i or /Hydration failed/i
    - expect: Only expected, benign console noise is tolerated (observed baseline: a 404 for /images/smiley-cyrus.jpeg placeholder avatar, and a CSS-preload-unused warning) — any hydration-related error is a candidate defect and must fail the test
