# prototype-builder

Repository for unattended prototype builds via Cursor Background Agents. Each prototype lives on its own branch named `prototype/<slug>`. Vercel auto-deploys a preview URL for every branch push. See [AGENTS.md](./AGENTS.md) for agent behavior.

## Getting started

### Use this repo directly

Clone the repo, install dependencies, and verify the scaffold:

```bash
git clone https://github.com/mcasado80/prototype-builder.git
cd prototype-builder
npm install
npm run build
npm run lint
```

### Create your own copy from the GitHub template

If this repo is marked as a template, click **Use this template** on GitHub to create a new repository under your account or org. Then clone your new repo and run the commands above.

Each copy is independent: it does not inherit Vercel projects, Cursor secrets, or deploy history from the template source.

## Connect Vercel

Preview deploys are not automatic until you link the repo:

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Accept the defaults (Next.js, root directory `.`, build command `npm run build`).
3. Deploy. Every push to any branch will get a preview URL; `main` gets production if you enable it.

If a prototype needs API keys or third-party credentials, add them in the Vercel project **Environment Variables** settings and in the Cursor Background Agent secrets store. Never commit secrets to the repo.

## The `docs/` folder

Put specs, mockups, PDFs, CSVs, and other reference files in [`docs/`](./docs/) before a run. Everything in that folder is **gitignored** — it stays on your machine and is never pushed.

Cloud agents clone from GitHub and cannot see those files. **Attach them in the first message** when you start the agent (e.g. `@docs/brief.pdf`). More detail in [docs/README.md](./docs/README.md).

## Run a Background Agent prototype

1. Open this repo in Cursor and start a **Background Agent** on `main`.
2. Add reference files to `docs/` if you have them, then **attach them in the first message** (required for cloud runs).
3. Paste your spec in that same first message.
4. The agent creates a branch `prototype/<slug>` from `main` and iterates there. **Do not commit prototype work to `main`.**
5. When the run finishes, you get a **live Vercel preview URL** for that branch. `REPORT.md` on the branch summarizes iterations and includes the URL. No PR is opened — the deployment is the deliverable.

## Branch conventions

| Branch | Purpose |
|--------|---------|
| `main` | Bare Next.js scaffold, `AGENTS.md`, and Cursor env config only |
| `prototype/<slug>` | One prototype per branch (e.g. `prototype/focus-tracker`) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (required before agent commits) |
| `npm run lint` | ESLint (required before agent commits) |
| `npm start` | Serve production build locally |

## Requirements

- Node.js 22 (see `.cursor/environment.json` for Background Agent runtime)
- npm
