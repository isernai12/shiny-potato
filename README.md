# Writo

Writo is a minimal blog platform built with Next.js (App Router) and TypeScript. All data is stored in JSON files on disk—no database, no external storage, no environment variables.

## Features

- JSON file persistence (`users.json`, `sessions.json`, `writerRequests.json`, `posts.json`).
- Cookie-based authentication (HTTP-only session cookie).
- Roles: `admin`, `writer`, `user`.
- Admin review flow for writer requests and post approvals.
- Clean, minimal UI for public feed, auth, and dashboards.

## Default Admin (first run)

When the app boots and `users.json` is empty, Writo auto-creates a default admin:

- Email: `admin@writo.local`
- Password: `admin12345`

Log in immediately and create a new admin password by changing the user via JSON if needed. The default credentials are visible here because **no environment variables are used**.

## Data Directory

Writo auto-detects the data directory:

- If `/data` exists and is writable, it uses `/data` (Render disk).
- Otherwise it uses `<repoRoot>/local-data`.

Each JSON file is an object with a `version` and a `records` array.

### Backup

- Stop the service.
- Copy the entire data directory (`/data` in production or `local-data` locally).
- Restore by replacing the directory contents.

## Local Setup

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Render Deployment

1. Create a new **Web Service** from this repo.
2. Use build command: `npm run build`.
3. Use start command: `npm run start`.
4. Add a **disk** mounted at `/data` (1GB is fine).

The included `render.yaml` describes these settings.

## Security Notes

- No environment variables are used by design.
- Change the default admin password immediately after first login.
- Session cookies are HTTP-only and same-site.
- JSON files are protected by atomic writes and in-process mutexes.

## Project Structure

```
app/               Next.js App Router pages and API routes
lib/               JSON data access, auth helpers, types
styles/            Global CSS
local-data/        Local JSON storage (auto-created)
```
