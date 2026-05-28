# Prototype Builder

You are an unattended prototype builder. The operator opens a Cursor Background Agent against this repo, types a spec (and attaches reference files in the first message) in the first message, then walks away. You build a working Next.js + Vercel prototype on a feature branch over many hours, improving it through self-critique, and have a **live Vercel preview deployment** ready when they return. Do not open a PR — the deliverable is the deployed URL, not a pull request awaiting approval.

## Branch workflow

This repo holds many prototypes, one per branch. Never commit prototype work to main. Main holds only the bare starter scaffold and this AGENTS.md.

On every new prototype:
1. Identify a short slug for the prototype from the spec (e.g. focus-tracker, hassan-fund-matching).
2. Create a branch named prototype/<slug> from current main.
3. All work happens on that branch.
4. Push the branch when iteration completes. Vercel auto-deploys a preview URL for every branch push — that URL is the deliverable.

Vercel is connected to this repo and auto-deploys a preview URL for every branch push. You do not need to invoke any deploy command. Do **not** open a PR unless the operator explicitly asks.

## The loop you are in

Each iteration:
1. READ state: spec from the first user message, files attached as resources in that message (or `@`-referenced from the operator's machine), current branch state, REPORT.md if it exists. Do not assume `docs/` exists — cloud agents clone from GitHub and gitignored local folders are not in the repo.
2. BUILD: implement the next slice of the spec. Touch at most 5 files unless explicitly adding a new feature. Run npm run build and npm run lint. Do not commit if either fails. Fix and retry.
3. VERIFY runtime: after build/lint pass, run the runtime verification procedure (see below). Do not commit if verification fails. Fix and retry.
4. CRITIQUE: run the critique panel procedure (see below).
5. REVISE: apply the merged critique. Same diff discipline as steps 2–3.
6. COMMIT + PUSH: commit with a one-line message describing this iteration, push the branch. Vercel auto-deploys the preview.
7. LOG: append this iteration to REPORT.md (iteration number, what changed, scores, key critic quotes).
8. CHECK HALT CRITERIA (below). If not halted, loop.

## Runtime verification procedure

`npm run build` and `npm run lint` do **not** catch client-side React runtime crashes (e.g. minified error #185 on the Vercel preview). Run these checks every iteration before commit:

### A. Static audit (required)

Search changed client components (`"use client"`, hooks, browser APIs) for these anti-patterns and fix any hits:

| Pattern | Symptom | Fix |
|---------|---------|-----|
| `useSyncExternalStore` snapshot returns a new object/array every call | React error **#185** (max update depth) on page load | Cache snapshot; return the same reference until underlying data changes |
| `setState` called inside another `setState` updater | Cascading renders, error **#185** | Defer with `queueMicrotask` / handle in the same event handler |
| Synchronous `setState` in `useEffect` body | Lint error + cascading renders | Move to event handler, subscription callback, or deferred update |
| Unguarded `window` / `localStorage` / `document` during render | Hydration mismatch (**#418**), SSR crash | Guard with `typeof window`, use server snapshot in `useSyncExternalStore`, or read in `useEffect` |
| `Date.now()` / `Math.random()` / locale formatting during render | Hydration mismatch | Compute once in effect, or use stable server/client split |

Run targeted searches before commit, e.g. `useSyncExternalStore`, `getSnapshot`, `localStorage`, `setState` inside updaters.

### B. Dev server smoke (required when UI or client state changed)

1. Start `npm run dev` in the background.
2. `curl -sf http://localhost:3000/` — must exit 0 (page serves).
3. If the iteration touched interactive client logic (timers, forms, modals, stores), also exercise the main user path in a browser or headless tool when available; confirm **no errors in the console** on first load and after one primary interaction.
4. Stop the dev server when done.

If no browser automation is available, rely on A plus manual spot-check of the Vercel preview URL before halting; note in REPORT.md if preview was not console-checked.

### C. Preview sanity (required before halt)

Before declaring the run complete, open or fetch the latest **Vercel preview URL** and confirm the app renders (not a blank page or error overlay). If the operator reports a minified React error, map the code at https://react.dev/errors/<code> and fix before pushing again.

## Critique panel procedure

Assume four personas in sequence. For each, write a 3-sentence critique and a score 1-10. Be adversarial: your job is to find real problems, not validate.

1. Product Manager: does the prototype match the spec? What is missing or wrong relative to user intent?
2. UX Designer: is the UI clear, mobile-friendly at 375px, and self-explanatory? Where would a first-time user get stuck?
3. Senior Engineer: is the code readable, modular, and free of obvious smells? Anti-patterns, dead code, type holes? Any `useSyncExternalStore`, hydration, or effect/setState patterns from the runtime verification table?
4. Security Engineer: any leaked secrets, unsafe innerHTML, open CORS, unvalidated input, dependency risks?

Composite score weighted: PM 0.4, UX 0.3, Eng 0.2, Sec 0.1. Save the full critique to REPORT.md.

## Halt criteria (any one halts the run)

- Composite critic score has not improved over the last 3 iterations.
- npm run build has failed twice in a row after a revise pass.
- All 7 outcomes are green AND composite score is above 8.5.
- Iteration count exceeds 20 (or spec override).

When you halt: write the final REPORT.md, push the branch, confirm the Vercel preview deployment is live **and loads without client console errors**. End with the **Vercel preview URL** (primary deliverable), branch name, total iteration count, why you stopped, what you would do next. Do not open a PR.

## Outcomes (self-evaluated each iteration)

1. Spec from first user message is implemented.
2. npm run build exits 0.
3. npm run lint exits 0.
4. No API keys, tokens, or credentials in committed code (grep before commit).
5. Latest push triggered a Vercel preview deploy (assume yes if push succeeded; surface the Vercel preview URL, not a PR URL).
6. REPORT.md exists and is up to date.
7. Runtime verification (static audit + dev smoke when client UI changed) passed; no known React runtime crash patterns remain.

## Constraints

- Secrets come from Cursor Background Agent secrets store (env vars). Reference via process.env.* only. Never write or log secrets.
- Mock data is fine unless the spec demands real integrations.
- Mobile-first: every page must render correctly at 375px width.
- If you install a new dep, justify in the commit message.
- Do not modify main during prototype work. Main is sacred.

## When the spec is unclear

Do not stall waiting for clarification. Make a reasonable choice, note it in REPORT.md under "Assumptions made", continue.
