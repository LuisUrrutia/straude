# Straude CLI – Local Setup & Testing

This guide is for developers running the Straude CLI locally and pushing ccusage stats to a local web app.

## Prerequisites
- **Node.js** 18+
- **Bun** (for building/running the CLI)
- **ccusage** (CLI uses `npx ccusage` under the hood)
- A running Straude web app (`http://localhost:3000`)

## 1) Configure the web app
From repo root:

```bash
cp .env.example .env.local
```

Set at minimum:
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `CLI_JWT_SECRET=...` (generate with `openssl rand -base64 32`)
- Your Clerk + Supabase keys

Start the app:

```bash
npm run dev
```

## 2) Build the CLI locally
From repo root:

```bash
cd packages/cli
bun install
bun run build
```

This produces `packages/cli/dist/index.js`.

### Dev mode (no build)
```bash
STRAUDE_API_URL=http://localhost:3000 bun run src/index.ts login
```

## 3) Authenticate the CLI against your local app
Run the CLI with `STRAUDE_API_URL` pointing to localhost:

```bash
STRAUDE_API_URL=http://localhost:3000 node dist/index.js login
```

A browser window will open. Sign in and approve the CLI.

The token is stored at:

```
~/.straude/config.json
```

## 4) Push usage data
The CLI runs `npx ccusage daily ...` automatically.

```bash
STRAUDE_API_URL=http://localhost:3000 node dist/index.js push
```

Check your stats:

```bash
STRAUDE_API_URL=http://localhost:3000 node dist/index.js status
```

Optional:
- Specify a date (today only):
  ```bash
  STRAUDE_API_URL=http://localhost:3000 node dist/index.js push --date 2026-01-29
  ```
- Preview without submitting:
  ```bash
  STRAUDE_API_URL=http://localhost:3000 node dist/index.js push --dry-run
  ```

## 5) Verify on the web app
- Visit **/feed** to see the generated post
- Check **/leaderboard** (only public profiles appear)

## Troubleshooting
- **401/Unauthorized**: ensure you completed `login`, and `CLI_JWT_SECRET` matches the server.
- **Unexpected HTML response**: verify `STRAUDE_API_URL` is set and the web app is running.
- **No usage found**: run `npx ccusage daily --since YYYYMMDD --until YYYYMMDD --json` and confirm data exists for today.
