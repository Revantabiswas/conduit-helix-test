# Knowledge MCP ↔ Knowledge Hub Integration — Reuse Existing-System Truth, Never Re-Derive It

**Purpose**: Forge does not re-discover a system it already has documentation for. **Knowledge Hub** holds the
existing-system truth for brownfield estates as **one deep dive `.md` document** for the estate/scope,
landing at `spec/plans/knowledge-hub-deep-dive.md`. The **Knowledge MCP server** is how Forge reaches Knowledge Hub.

**The rule in one line**: when the work touches an existing system, Knowledge Hub is the source of the
reverse-engineering truth and Forge consumes it; Forge generates that truth locally **only** when Knowledge Hub
is genuinely unavailable, and says so out loud when it does.

**Load this file when**: Workspace Detection runs, Reverse Engineering is being considered, a
migration/modernisation is detected, or any stage needs existing-system context.

---

## 1. When Knowledge MCP is REQUIRED (blocking) vs OPTIONAL

| Situation | Knowledge MCP |
|---|---|
| **Brownfield** — existing code detected in the workspace | 🔴 **REQUIRED** — prompt to connect and HALT |
| **Migration / modernisation / re-platform** — stated by the user or inferred from the Epic | 🔴 **REQUIRED** — prompt to connect and HALT |
| **Integration with an existing system** the workspace does not contain | 🔴 **REQUIRED** — prompt to connect and HALT |
| **Greenfield**, no existing system referenced anywhere | ⚪ **OPTIONAL** — never prompt, never block |

**Migration/brownfield detection signals** (any one is enough):
- Workspace Detection classified the workspace **brownfield**.
- The Epic / ticket / user request contains: *migrate, migration, modernise/modernize, re-platform,
  replatform, port, legacy, rewrite, refactor <existing system>, strangler, lift and shift, upgrade
  from, replace <system>, integrate with <existing system>*.
- The user names a system that is not in this workspace as something to build against.

---

## 2. Local-first check — before contacting Knowledge MCP at all

🔴 **Always check the workspace before ever reaching for Knowledge Hub.** This runs as part of Workspace
Detection (`planning/workspace-detection.md` Step 3), before Section 1's REQUIRED/OPTIONAL dispatch
even matters:

1. **Check whether `spec/plans/knowledge-hub-deep-dive.md` already exists** in the workspace (default location
   first, then the whole-repo glob workspace-detection.md already does for the flat RE docs).
2. **If it exists**: reuse it as current-system truth. Do NOT contact Knowledge MCP, do NOT re-pull, do NOT
   show the connect gate. Load it like any other existing RE artifact.
3. **If it does NOT exist**: proceed to Section 3 (Discovery) and, per Section 1, resolve a Knowledge MCP
   provider and pull the deep dive doc from Knowledge Hub.

This is a plain file-existence check, not a freshness policy — if the user wants a forced refresh from
Knowledge Hub, they say so explicitly and Forge re-pulls, overwriting the local file.

---

## 3. Discovery — never hardcode, always resolve at runtime

🔴 **Do NOT assume tool names.** Deployments differ. Resolve the server and its tools at the moment
you need them.

**Resolution order:**

1. **Enumerate the connected MCP servers and their tools** available in this session (the host lists
   them; use the tool-discovery mechanism the session provides).
2. **Match a Knowledge Hub provider** — a server or tool whose name or description contains any of:
   `studio`, `Knowledge Hub`, `deepdive`, `deep dive`, `codebase graph`.
3. **Classify the matched tools by capability**, by what their descriptions say they do:
   - **DOCS** — fetches the deep dive `.md` document for the estate/scope (the pull Forge actually uses)
   - **GRAPH / SEARCH** — queries relationships or free-text across the indexed estate, used only for a
     targeted inline answer a stage needs (Section 5) — never to produce their own flat artifact file
4. **Record the binding** in `runtime-artifacts/forge-state.md` (Section 7) so later stages and later sessions reuse it without
   re-discovering.

**If matching is ambiguous** (several plausible servers): list what you found and ask the user which
one is Knowledge MCP. Do not guess — pulling architecture truth from the wrong system is worse than pausing.

### TOOL BINDING — fill in on first successful discovery

Write the resolved binding into `runtime-artifacts/forge-state.md`. Never invent values for it.

```markdown
## Knowledge MCP Binding
- **Server**: <resolved MCP server name>
- **Docs tool(s)**: <tool name(s)> — <one-line purpose>
- **Graph/Search tool(s)**: <tool name(s)> — <one-line purpose, if any>
- **Estate / workspace id**: <the Knowledge Hub workspace or repo identifier queried>
- **Resolved**: <ISO 8601 timestamp>
```

---

## 4. The connect gate (blocking)

When Knowledge MCP is REQUIRED (Section 1), `spec/plans/knowledge-hub-deep-dive.md` does not already exist locally
(Section 2), and either no Knowledge MCP provider resolves OR Knowledge Hub has no deep dive doc for this scope,
**HALT**. Do not fall back to local reverse engineering without the user's explicit instruction —
silently re-deriving what Knowledge Hub already holds produces a second, divergent source of truth, which is
the exact failure this integration exists to prevent.

Emit **verbatim**, substituting the bracketed values:

```
 KNOWLEDGE MCP REQUIRED — connect Knowledge Hub to continue

   This is a [brownfield workspace | migration | integration with an existing system].
   Forge reuses Knowledge Hub's existing-system truth instead of re-deriving it: the deep dive doc holds the
   system's architecture, components, dependencies and behaviour, already reviewed.

   [No Knowledge MCP server is connected in this session | Knowledge MCP is connected, but Knowledge Hub has no deep dive
   document for this codebase].

 How do you want to proceed?
   A)  You connect Knowledge MCP now, or you generate the deep dive document on Knowledge Hub yourself — Forge stops
         here; re-run once it's connected/generated on the platform. (Recommended)
   B)  Proceed WITHOUT Knowledge Hub — Forge generates reverse-engineering artifacts locally from the code
         in this workspace. This choice is recorded in runtime-artifacts/forge-state.md and runtime-artifacts/audit.md.

[Answer]:
```

🔴 **Only options A and B — never add a third.** Both triggers for this gate (no Knowledge MCP connected, or
Knowledge MCP connected but no deep dive doc found) land on the exact same two-option prompt and resolve
through option B's same recorded outcome. Never invent an option C.

- **A** → HALT. Log the halt in `runtime-artifacts/audit.md`. Nothing else runs.
- **B** → record `Source: local-generation (Knowledge Hub unavailable — user approved)` in the provenance
  block, in `runtime-artifacts/forge-state.md`, and in `runtime-artifacts/audit.md`, then run the normal
  `planning/reverse-engineering.md` stage to **generate** the reverse-engineering artifacts locally.
  🔴 Every downstream artifact derived this way carries the line *"Existing-system context derived
  locally; Knowledge Hub was not consulted."*

🔴 Log the prompt and the raw user response in `runtime-artifacts/audit.md`. This is a real decision with downstream
consequences and it must be attributable.

---

## 5. What to pull, and where it lands

Once a Knowledge MCP provider is bound, pull **before** any planning stage that needs system context — that
is, before Reverse Engineering is even considered, and before Requirements Analysis reads its inputs.

🔴 **Knowledge Hub is the source of current-system truth at the START of EVERY cycle, and its destination at
the END.** Each new cycle that needs a fresh pull gets the deep dive doc from Knowledge Hub
(`spec/plans/knowledge-hub-deep-dive.md`) rather than carrying forward anything from a prior cycle — and when
the cycle closes, what it changed is published **back** to that same Knowledge Hub document, so the next
cycle's pull already contains it. The loop, in order:

1. **Pull** — the deep dive lands at `spec/plans/knowledge-hub-deep-dive.md` (this section).
2. **Build** — the cycle runs against it as existing-system truth.
3. **Delta** — `archive-epic` (`agents/archive-epic-agent.md` Step 3) writes what actually shipped to
   `spec/plans/delta/<CYCLE-ID>-<slug>/delta.md` as a change record — a path-level evidence table plus
   the problems this cycle resolved — and archives it with the rest of `spec/`.
4. **Refresh** — after the cycle's PR merges, `stitch-delta` (`agents/stitch-delta-agent.md`) reads that
   delta **out of the cycle archive** (`archive-epic` already removed the live `spec/`) and refreshes the
   **whole Knowledge Hub document**: every section decided against the **merged code on base**, then the complete
   body written back via the DOCS tools and one row appended to `forge-archives/stitch-ledger.md`. 🔴 The
   refresh is bounded by the document's own outline, never by the delta's coverage — that is what keeps
   the deep dive the current face of the application rather than 90% of it. No local staging copy exists
   at any point.

🔴 **A cycle still never diffs itself against a previous cycle's documents** — it diffs itself against
the *pulled* Knowledge Hub truth, and the stitch is what keeps that truth current instead of letting it drift
one cycle behind reality.

| Pull | Via | Lands in | Replaces |
|---|---|---|---|
| **Deep dive document** — one `.md` document covering the estate/scope | DOCS tool | `spec/plans/knowledge-hub-deep-dive.md`, verbatim | Locally generated RE artifacts |
| **Epic brief** — the tracking item's summary/description/acceptance criteria, when the user is working via Knowledge MCP rather than a configured tracker fetch | DOCS tool | `spec/plans/epic-brief.md`, verbatim | The tracker-driven fetch in `common/tracker-sync.md` Section 2 |
| **Targeted answers** — a specific contract, schema, or flow a stage needs | SEARCH / GRAPH | Quoted inline in the consuming artifact, with the citation | Guessing |

🔴 **If the DOCS tool reports no deep dive document for the resolved scope**, do not treat this as an
error to retry or paper over. Tell the user plainly: **"No deep dive document found on Knowledge Hub."** Then
go to Section 4 (the connect gate) and present the same A/B halt — if the user picks B, **generate**
the reverse-engineering artifacts locally, exactly as any other local-generation path, and say so in
every artifact's provenance.

### 5.4 Combined presence gate — Epic and/or deep dive missing on Knowledge MCP

🔴 Applies whenever the user directs Forge to work via Knowledge MCP for BOTH the Epic and the deep dive
(e.g. "start working on this using knowledge mcp"). After the pull attempt in the table above, check the
two artifacts **independently** — never assume one implies the other:

🔴🔴 **TRACKER TYPE IS NOT AN OVERRIDE — Knowledge-Hub-as-content-source and Tracker-as-push-destination are
orthogonal.** `## Tracker` → `Type` (JIRA/ADO/GITHUB/LOCAL, per `common/tracker-sync.md`) governs ONLY
where stories/the Epic get pushed and tracked for status — it says NOTHING about where Epic *content*
is sourced from. When the user has directed Knowledge MCP for the Epic, this Section 5.4 gate is
**MANDATORY and takes priority over `common/tracker-sync.md` Section 2's per-tracker fetch table** —
including its LOCAL row ("no fetch — ask the user to type a description"). Do NOT read `Type: LOCAL` (or
any other tracker type) as license to skip this gate, silently fall back to asking the user to type the
Epic inline, or silently file a non-Epic-typed document under `spec/context-project/new-references/` as
a quiet substitute. The tracker-sync.md LOCAL fallback applies ONLY when the user never directed Knowledge MCP
to source the Epic in the first place (e.g., greenfield, or Knowledge MCP not required per Section 1). If Knowledge MCP
was consulted and no Epic-typed document was found, that is ALWAYS this gate — never a silent
reclassification, regardless of tracker type.

🔴🔴 **STRICT TYPE MATCH — NO SUBSTITUTION, NO EQUIVALENCE, EVER.** A document counts as "the Epic
brief" ONLY if Knowledge Hub's own document-type classification for it is exactly Epic/Epic brief. A
document counts as "the deep dive" ONLY if its type classification is exactly deep dive. **A PRD, a
"Quick Orient" / software-archaeology analysis, a README, a design doc, or ANY other document type is
NEVER treated as equivalent, close enough, or a stand-in — no matter how similar its content looks, and
no matter how confident the match feels.** Do not silently pull, rename, or reinterpret a
differently-typed document as if it satisfies the Epic brief or deep dive requirement, and do not
narrate it as "the Epic and deep dive equivalents" or similar softening language. If Knowledge Hub holds only
differently-typed documents for this scope, that IS the missing case (row 2/3/4 below) — those
documents belong ONLY in the "Other documents found" list of the gate, exactly as they are, never
folded into `epic-brief.md` or `knowledge-hub-deep-dive.md` without the user explicitly choosing option B.

1. **Epic brief present, deep dive present** → no gate. Proceed normally (Section 5, Section 6).
2. **Epic brief missing, deep dive present** → emit the gate below naming only the Epic as missing.
3. **Deep dive missing, Epic brief present** → emit the gate below naming only the deep dive as missing.
4. **Both missing** → emit the gate below naming both.

In every triggered case, also list whatever OTHER documents the DOCS tool did return for the resolved
estate/scope — the user needs to see what's actually there, not a flat "not found." Emit, substituting
the bracketed values:

```
 KNOWLEDGE MCP — [Epic | deep dive | Epic and deep dive] not found for this scope

   Knowledge MCP is connected and reachable, but Knowledge Hub has no [Epic brief | deep dive document | Epic brief or
   deep dive document] for this estate/scope.

   Other documents found on Knowledge Hub for this scope:
     - [doc title/type 1]
     - [doc title/type 2]
     (or: "None — Knowledge Hub has no documents at all for this scope.")

 How do you want to proceed?
   A)  You generate the missing [Epic | deep dive | Epic and deep dive] on Knowledge Hub yourself —
         Forge stops here; re-run once it's generated on the platform. (Recommended)
   B)  [Epic missing: Manually invoke the `intent-intake` skill — pass it the other found document(s)
         above (e.g. the PRD) as its reference input.
         | Deep dive missing: Proceed using the other found documents above as reference — Forge
         generates knowledge-hub-deep-dive.md locally via `planning/reverse-engineering.md`.
         | Both missing: Manually invoke the `intent-intake` skill — pass it the other found document(s)
         above (e.g. the PRD) as its reference input. This choice is recorded in
         runtime-artifacts/forge-state.md and runtime-artifacts/audit.md.

[Answer]:
```

🔴 **Only options A and B — never add a third**, same guardrail as Section 4.

- **A** → HALT. Log the halt and the "other documents found" list in `runtime-artifacts/audit.md`. Nothing else runs.
- **B** → record `Source: local-generation (Knowledge Hub unavailable — user approved use of other found
  documents as reference)` for each missing artifact in `runtime-artifacts/forge-state.md` and
  `runtime-artifacts/audit.md`. Generate ONLY the missing piece(s) — an artifact that WAS found on
  Knowledge Hub with the exact required type is still pulled verbatim, never regenerated:
  - **Epic missing** → Forge does NOT generate `epic-brief.md` itself here, and does NOT invoke
    `intent-intake` on the user's behalf either. It tells the user to manually invoke `intent-intake`
    themselves, naming the other found document(s) (e.g. a PRD) as the reference input to hand that
    skill, then HALTS this gate and waits — `intent-intake` runs its own baseline-gathering flow and
    produces the Epic through it, never a hand-summarized shortcut, never a Forge-triggered call. For
    LOCAL tracker,
    `intent-intake` writes `spec/plans/epic.md` per its own contract — copy/link its result into
    `spec/plans/epic-brief.md` as this file's expected Epic input once `intent-intake` completes. For
    JIRA/ADO/GITHUB, `intent-intake` pushes the Epic to the configured tracker as it normally would,
    then Forge fetches it back into `epic-brief.md` per `common/tracker-sync.md` Section 2.
  - **Deep dive missing** → generate `knowledge-hub-deep-dive.md` locally via the normal
    `planning/reverse-engineering.md` stage, using the "other documents found" list as reference input.
  - 🔴 Every artifact produced via this path carries the line *"Existing-system context derived locally
    from [list the other-document names used]; no document typed exactly as the Epic brief / deep dive
    was found on Knowledge Hub."*

🔴 Log the prompt, the "other documents found" list, and the raw user response in
`runtime-artifacts/audit.md` — same attributability requirement as Section 4.

### 5.1 Scoping the pull — pull what the work touches, not the whole estate

🔴 **Never dump the entire estate.** Resolve scope in this order and pull only that:
1. The components named in the Epic / ticket / requirements.
2. Their **direct** dependencies and dependents, per the deep dive doc's own component map (one hop).
3. Any component that owns a data store or contract the work will read or write.

Record the scope you resolved and why. If a later stage needs a component outside the pulled scope,
pull it then — incrementally — and note the extension.

### 5.2 Provenance block — MANDATORY on every artifact sourced from Knowledge Hub

Every file written from Knowledge Hub content opens with this block. A Knowledge Hub-derived document without
provenance is indistinguishable from an AI-invented one, which destroys its value as truth.

```markdown
> **Source**: Knowledge Hub via Knowledge MCP
> **Server / tool**: <server> · <tool>
> **Estate**: <estate or repo identifier>
> **Scope pulled**: <components and the rule that selected them>
> **Fetched**: <ISO 8601 timestamp>
> **Freshness**: <Knowledge Hub's own last-indexed timestamp, if it exposes one — else "not reported">
```

### 5.3 🔴 Never edit Knowledge Hub content to make it fit

Knowledge Hub documents are **read-only inputs**. Copy them faithfully. If Knowledge Hub contradicts an assumption in
the Epic, the requirements, or a design artifact, that contradiction is a **finding to surface**, not
a discrepancy to smooth over:

> **Knowledge Hub conflict** — `<component>`: Knowledge Hub states `<X>`; `<artifact>` assumes `<Y>`.
> Proceeding on Knowledge Hub (existing-system truth wins) and amending `<artifact>` to match.
> Recorded in runtime-artifacts/audit.md.

Follow Knowledge Hub, amend the Forge-side artifact to stay truthful, say so plainly, log it. Never the reverse
— never rewrite a Knowledge Hub document to agree with a plan.

🔴 **The ONE sanctioned write path is the post-merge stitch** (`agents/stitch-delta-agent.md`), and it
does not weaken this rule: it publishes what a cycle **already shipped and merged**, as targeted
per-section edits derived from the real diff — never a plan, never a prediction, never a reshaping of
sections the cycle did not touch. Everything outside that path stays read-only. Specifically forbidden,
in every stage and at cycle close alike: editing a Knowledge Hub document so a design artifact stops
contradicting it, publishing a delta whose cycle PR has not merged, and "tidying" prose while stitching.

---

## 6. Effect on the Reverse Engineering stage

🔴 If the user invoked Knowledge MCP for BOTH the Epic and the deep dive, run the Section 5.4 combined
presence gate FIRST — it supersedes the single-artifact table below whenever both pulls were attempted
together. The table below still applies as-is when only the deep dive was pulled via Knowledge MCP (Epic
sourced from the configured tracker instead).

`planning/reverse-engineering.md` becomes **conditional on whether Knowledge Hub returns a deep dive document**:

| Knowledge Hub deep dive doc | Reverse Engineering stage |
|---|---|
| **Already exists locally** (`spec/plans/knowledge-hub-deep-dive.md`, Section 2) |  **SKIPPED.** Reuse it as-is. Record `Source: Knowledge Hub (local file)`. |
| **Found** on Knowledge Hub for the resolved scope |  **SKIPPED.** Pull it into `spec/plans/knowledge-hub-deep-dive.md`, verbatim — it IS the artifact. Record `Source: Knowledge Hub`. Announce the skip and what it saved. |
| **Not found** (Knowledge MCP connected, but Knowledge Hub has no deep dive doc for this scope) | Tell the user *"No deep dive document found on Knowledge Hub."* Then present the Section 4 connect gate (A/B) — on **B**, ▶ **generate** the reverse-engineering artifacts locally, with the "Knowledge Hub was not consulted" banner on every artifact. |
| **Knowledge MCP unavailable**, user chose option B at the connect gate (Section 4) | ▶ **generate** the reverse-engineering artifacts locally, exactly as before, with the "Knowledge Hub was not consulted" banner on every artifact. |

Record which branch was taken in `runtime-artifacts/forge-state.md` and `runtime-artifacts/audit.md`. Announce it — the user needs to know
whether they are reading reviewed estate truth or a fresh AI derivation.

---

## 7. State recorded in `runtime-artifacts/forge-state.md`

```markdown
## Existing-System Context
- **Workspace type**: brownfield | greenfield | migration
- **Knowledge MCP**: connected | not connected | declined by user
- **Source**: Knowledge Hub (local file) | Knowledge Hub | local-generation
- **Components in scope**: <list>
- **Knowledge Hub deep dive doc**: spec/plans/knowledge-hub-deep-dive.md | not found | not fetched
- **Recorded**: <ISO 8601 timestamp>
```

---

## 8. Downstream consumers — who reads Knowledge Hub content and for what

| Stage / artifact | Uses |
|---|---|
| Requirements Analysis | `knowledge-hub-deep-dive.md` to ground scope and spot impacted components the Epic omitted |
| User Stories | Component boundaries from `knowledge-hub-deep-dive.md` to keep stories independently implementable |
| Dependency Graph | Real inter-component dependencies from `knowledge-hub-deep-dive.md` — not guessed from story titles |
| `spec/plans/architecture.md` | Existing architecture is the **starting state**; the design records the delta from it |
| `tests/.evals/rubrics/architecture-rubric.json` | Fallback chain link 3 — derive criteria from Knowledge Hub truth when no design stage ran |
| Code Generation | Real signatures, error shapes and conventions of the code being changed |

🔴 **A stage that needs existing-system context and has none must say so** — not proceed on
assumption. "I don't have Knowledge Hub coverage for `<component>`" is a valid, required output.
