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

## Run a Background Agent prototype

1. Open this repo in Cursor and start a **Background Agent** on `main`.
2. In the first message, paste your spec (and attach reference docs if you have them).
3. The agent creates a branch `prototype/<slug>` from `main` and iterates there. **Do not commit prototype work to `main`.**
4. When the run finishes, the agent opens a PR titled `Prototype: <slug>` with `REPORT.md` as the description. The Vercel preview URL appears on that PR.

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
