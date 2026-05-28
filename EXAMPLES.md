# Example prompts

Copy-paste one of these specs as the **first message** when starting a Cursor Background Agent on `main`. Attach any reference files from `docs/` in that same message. The agent follows [AGENTS.md](./AGENTS.md) for the build loop, critique panel, halt criteria, and deliverables.

---

## Focus Tracker

```
Build the Focus Tracker prototype described below. Follow AGENTS.md in this repo for the loop, critique panel, halt criteria, and outcomes.

SLUG
focus-tracker

CONCEPT
A "Focus Tracker" single-page Next.js app for tracking deep-work focus sessions. User starts a timer (default 25 min, configurable presets 15/25/45/60). When the timer ends, they log what they worked on. App shows today's sessions and a 7-day streak counter.

FUNCTIONAL REQUIREMENTS
1. Big visible timer, start/pause/reset.
2. After timer ends, modal asks "What did you focus on?".
3. Sessions list, today's entries grouped.
4. Streak counter: consecutive days with at least one completed session.
5. State in localStorage.
6. Empty state with a friendly nudge.

TECH
Next.js 14 app router, Tailwind. No external APIs. No LLM calls for this smoke test.

LOOK
Clean single column, light mode, mobile-first 375px.

SMOKE TEST OVERRIDES
- Halt after iteration 3.
- Composite score threshold lowered to 7.5 for early halt.

EXPLICIT DELIVERABLE
Branch prototype/focus-tracker pushed to GitHub. REPORT.md contains the iteration log AND the live Vercel preview URL that renders the timer app. No PR.

Begin.
```

---

## Mood Journal

```
Build the "Mood Journal" prototype described below. Follow AGENTS.md.

SLUG
mood-journal

CONCEPT
A small personal mood-tracking app. Each day, the user picks an emoji that represents their mood and writes a one-line note. The app shows a monthly calendar grid with each tracked day color-tinted by mood. Tapping a past day reveals its note.

FUNCTIONAL REQUIREMENTS
1. Home view (today): a row of 5 emoji options (e.g., 😞 😕 😐 🙂 😄), a textarea labeled "What's on your mind?" (max 200 chars), a "Save today" button.
2. After saving, today's entry shows below with an "Edit" link that reopens the form pre-filled.
3. Calendar view: monthly grid for the current month. Each day cell shows the mood emoji if logged, blank otherwise. Day cells with a logged mood are background-tinted on a 5-step scale (suggest red → orange → yellow → green → blue, or any reasonable warm-to-cool ramp).
4. Tap a logged day in the calendar to see its note inline in a small popover or bottom sheet, with the date as the title.
5. Month navigation: prev/next month buttons, plus a "Today" button to jump back to the current month.
6. State persisted in localStorage, keyed by date string (format YYYY-MM-DD).
7. Empty state for a fresh month: a friendly nudge ("Tap a mood above to log today").
8. No backend, no auth, no external APIs.

TECH
Next.js 14 app router, Tailwind. Use date-fns for date math (justify the dep in the commit message per AGENTS.md). No LLM calls.

LOOK
Clean, warm light mode, mobile-first 375px. Calendar squares should fit comfortably at phone width (suggest 40-44px). Emoji prominent in day cells. Layout should feel personal and inviting, not clinical.

SMOKE TEST OVERRIDES
- Halt after iteration 3.
- Composite score threshold lowered to 7.5 for early halt.

EXPLICIT DELIVERABLE
Branch prototype/mood-journal pushed. REPORT.md contains the iteration log + live Vercel preview URL. The preview must let me log today's mood, see it appear in the calendar, navigate to the previous month, and tap a past day to see its note. No PR.

Begin.
```
