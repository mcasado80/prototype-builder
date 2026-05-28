# Reference materials

Local staging for specs, mockups, sample data, and other inputs. Contents are **gitignored** and stay on your machine — they are not pushed to GitHub.

## What to put here

- Product specs, briefs, or PRDs (`.md`, `.pdf`, `.docx`)
- Screenshots, mockups, or design exports (`.png`, `.jpg`, `.svg`)
- Spreadsheets or CSVs with sample data
- API docs, wireframes, or competitor notes

Use subfolders if helpful (e.g. `docs/designs/`, `docs/sample-data/`).

## How the agent gets these files

**Cloud Background Agents clone from GitHub.** Gitignored folders are not in the repo, so the cloud agent never sees them unless you pass them explicitly.

| Run type | What to do |
|----------|------------|
| **Cloud agent** | Attach files in the **first message** (drag-and-drop or `@docs/your-file.pdf`). Those attachments become agent resources for the run. |
| **Local agent** | Attach in the first message, or reference files under `docs/` if the agent runs in your local workspace. |

Keeping files here first helps you organize material before attaching, and keeps sensitive or bulky files out of git.

## Cleanup

Remove or replace files between prototype runs so you do not attach stale context to the next run.
