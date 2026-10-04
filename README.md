# Forma

Forma is a single-page website builder built with **Next.js 16 App Router, React 19, and TypeScript**. A client-side visual editor works with a structured JSON page tree; server route handlers manage authenticated projects, AI generation, and published snapshots in MongoDB Atlas.

Start from a template or an AI draft, edit the page visually, save a private project, publish it at `/sites/[slug]`, or export standalone HTML.

| Layer | Technology | Role |
| --- | --- | --- |
| Application | Next.js 16, React 19, TypeScript 6 | App Router pages, server APIs, and interactive editor |
| Interface | Tailwind CSS 4, Radix UI, Lucide | Styling, accessible UI primitives, and icons |
| Validation | Zod 4 | Page structure, styles, URLs, and API inputs |
| Persistence | MongoDB driver 7, MongoDB Atlas | Private projects, published snapshots, sessions, and AI quotas |
| Authentication | Better Auth | Email/password accounts, sessions, verification, and recovery |
| AI | OpenRouter via server-side `fetch` | Generate structured page content from a prompt |
| Email | Nodemailer / SMTP | Verification and password-reset messages |
| Hosting | Vercel / Node.js 22+ | Next.js deployment and server functions |

## Run locally

**Prerequisites:** Node.js 22 or newer and npm. Cloud services are optional for the local demo.

1. Install the locked dependencies:

   ```sh
   npm ci
   ```

2. Create your local environment file:

   ```sh
   cp .env.example .env.local
   ```

3. For cloud features, replace the placeholder values using the configuration below. For the demo, leave `MONGODB_URI` and `BETTER_AUTH_SECRET` empty.
4. Start the development server:

   ```sh
   npm run dev
   ```

5. Open [localhost:3000](http://localhost:3000), or go directly to the [local demo](http://localhost:3000/dashboard?demo=1).

> The demo stores projects only in the current browser's `localStorage`. It supports editing, local saves, and HTML export. It does not create accounts, call the AI provider, publish sites, or grant cloud access. Clearing browser storage removes demo projects.

For a local production build:

```sh
npm run build
npm run start
```

Cloud accounts in production mode require SMTP configuration, including when running `npm run start` locally.

## Environment variables

Use [.env.example](.env.example) as the configuration template. Keep secrets out of version control; only `NEXT_PUBLIC_APP_URL` uses the public prefix.

| Variable | Purpose | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical origin, such as `http://localhost:3000` or your HTTPS domain | Cloud authentication |
| `MONGODB_URI` | MongoDB connection string; deployment must support transactions | Cloud data and accounts |
| `MONGODB_DB` | Database name; defaults to `forma` | Optional override |
| `BETTER_AUTH_SECRET` | Stable secret of at least 32 characters | Cloud authentication |
| `OPENROUTER_API_KEY` | Server-only provider key | AI generation |
| `OPENROUTER_MODEL` | Model ID; defaults to `qwen/qwen3.5-flash-02-23` | Optional override |
| `SMTP_HOST` | SMTP server hostname | Email and production authentication |
| `SMTP_PORT` | Defaults to `587`; `465` enables secure transport on connection | Optional override |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials | Email and production authentication |
| `EMAIL_FROM` | Verified sender, such as `Forma <hello@yourdomain.com>` | Email and production authentication |

Generate an authentication secret with:

```sh
openssl rand -base64 32
```

Restart the development server after changing configuration. Redeploy after changing public environment variables on Vercel.

### MongoDB Atlas

1. Create an Atlas cluster and a database user with `readWrite` access to the `forma` database. A replica set is required for transactions; Atlas clusters support them.
2. Set `MONGODB_URI` and, if needed, `MONGODB_DB` in `.env.local`.
3. Configure Atlas network access for your local machine and hosting environment. Use restricted egress where available, or Atlas's supported public access with strong credentials and TLS.

The server reuses a MongoDB client promise with a connection pool of up to **10 connections** and an **8-second server-selection timeout**. Required indexes are created on the first authenticated request, including owner/update-time indexes, unique project and snapshot identifiers, and a TTL index for AI usage records.

| Collections | Stored data |
| --- | --- |
| `user`, `session`, `account`, `verification`, `rateLimit` | Better Auth account, session, verification, and rate-limit records |
| `projects` | Owner-scoped editable drafts |
| `published_sites` | Public snapshots, separate from private drafts |
| `ai_usage` | Per-user daily request counters with expiry |

### Accounts and email

Better Auth uses email/password authentication with a **10-character minimum password length**. Sessions expire after **7 days**, with a **1-day update age**.

- Production authentication requires configured SMTP and verified email before sign-in.
- Development accounts can be created without SMTP; password recovery still requires email delivery.
- Password resets revoke existing sessions. Account deletion removes owned projects, snapshots, and AI usage within a transaction.
- Authentication rate limits are database-backed: signup allows 5 requests/minute, sign-in 10, and password-reset requests 3.
- Email delivery is scheduled with Next.js `after()` so it can continue after the response on Vercel.

Verify sender DNS, SMTP delivery, and spam placement before public launch.

### OpenRouter

AI requests go through the server to OpenRouter's chat completions endpoint. Set `OPENROUTER_API_KEY`; use `OPENROUTER_MODEL` to switch models without frontend changes. No OpenAI account or SDK is needed.

| Constraint | Value |
| --- | --- |
| Access | Authenticated cloud accounts only |
| Prompt length | 15–2,000 characters |
| Daily quota | 10 attempts per user per UTC day |
| Minimum request interval | 10 seconds per user |
| Provider timeout | 45 seconds |
| Output token cap | 7,000 tokens |
| Route duration | 60 seconds |

MongoDB atomically enforces quotas across server instances. Each accepted attempt, including a provider failure, consumes one credit. Provider output must parse as JSON and pass the shared page schema before it reaches the editor.

Set a spending limit on your OpenRouter key: per-account quotas do not cap total spending across all users. Confirm the configured model is available to your provider account.

## Architecture and page model

The editor, renderer, and exporter share the `SiteNode` format in [lib/site.ts](lib/site.ts). A page has one `__body` root and nested nodes with `id`, `name`, `type`, `styles`, and `content` fields.

```text
Template or AI response → validated page tree → visual editor
                                                ├─ Save → private draft in projects
                                                ├─ Publish → snapshot in published_sites
                                                └─ Export → standalone HTML
```

Supported node types are `__body`, `container`, `2Col`, `text`, `link`, `image`, and `video`. Containers hold child arrays; leaf nodes hold text, link, or media attributes.

**Validation boundaries:**

- One body root, unique element IDs, at most 250 nodes, nesting depth up to 8 below the root, and at most 80 children per container.
- An explicit CSS-property allowlist; unsafe style values and unsupported properties are rejected.
- URL checks reject script URLs, data URLs, protocol-relative URLs, and malformed values. Video rendering allows supported HTTPS YouTube embed URLs only.
- Page content is validated before saving, publishing, rendering a public snapshot, and exporting. HTML export escapes user text and attributes.

**Persistence and access:**

- Project APIs derive the owner from the Better Auth session and query by `user_id`; browsers never query MongoDB directly.
- Mutation APIs require a matching request origin. Private project responses use `Cache-Control: no-store`.
- Publishing copies the saved draft into a separate snapshot. Later draft saves do not change the public site until it is published again.
- Publishing and project deletion use transactions to keep drafts and snapshots consistent. Unpublishing removes the public snapshot.
- The editor saves manually, tracks unsaved changes, and keeps up to 80 in-memory history entries for undo/redo.

### Project layout

```text
app/
  api/auth/[...all]/     Better Auth route handler
  api/generate/         Authenticated AI generation
  api/projects/         Project CRUD and publishing APIs
  dashboard/            Project workspace
  editor/               Visual editor entry point
  sites/[slug]/         Public snapshot renderer
components/
  forma/                Builder, dashboard, auth, and site renderer
  ui/                   Reusable interface primitives
lib/
  site.ts               Page schema, templates, tree helpers, HTML export
  projects.ts           Cloud API client and browser-only demo storage
  auth.ts               Server authentication and email configuration
  db.ts                 MongoDB connection and indexes
  api.ts                Session/origin checks and API error handling
  quota.ts              Atomic AI usage limits
scripts/smoke.mts        Integration smoke test
tests/site.test.ts       Page validation and export unit tests
```

### Route reference

| Method | Route | Behavior |
| --- | --- | --- |
| `GET`, `POST` | `/api/auth/[...all]` | Better Auth account and session operations |
| `GET`, `POST` | `/api/projects` | List owned projects or create from `studio`, `portfolio`, or `blank` |
| `GET`, `PUT`, `DELETE` | `/api/projects/[id]` | Read, save, or delete an owned project |
| `POST`, `DELETE` | `/api/projects/[id]/publish` | Publish the saved draft or remove its public snapshot |
| `POST` | `/api/generate` | Generate validated elements from `{ "prompt": "…" }` |
| `GET` | `/sites/[slug]` | Render a public snapshot without account access |

Cloud workspaces support up to **100 projects**. JSON responses from project and generation APIs use an `error` field for failures; validation, session, origin, and quota failures return appropriate HTTP statuses.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm test` | Run page-model unit tests with `tsx` and Node's test runner |
| `npm run check` | Run lint, typecheck, unit tests, and build in sequence |
| `npm run test:integration` | Run authentication, persistence, and ownership smoke tests |

Run the required checks before finishing changes:

```sh
npm run check
```

Additional integration and dependency checks:

```sh
npm run test:integration
npm audit --omit=dev
```

Unit tests cover template validity, URL policy, HTML escaping, unsafe styles, malformed/deep trees, duplicate IDs, and immutable nested edits.

The integration test starts an ephemeral MongoDB replica set and a separate Next.js development server on **port 3100**, with build output in `.next-smoke`. It downloads a MongoDB test binary on first use; keep the port available.

It exercises real signup/sessions, ownership isolation, cross-origin rejection, validation, saves, private draft isolation, publishing, unpublishing, transactional deletion, concurrent AI quotas, password changes, and account deletion. It does not send email or call a paid AI provider.

Before changing framework code, read the relevant Next.js 16 documentation in `node_modules/next/dist/docs/`, as required by [AGENTS.md](AGENTS.md). See [DESIGN.md](DESIGN.md) for the interface design reference.

## Deploy on Vercel

1. Import this repository as a Next.js project.
2. Choose Node.js 22 or newer. Set install to `npm ci` and build to `npm run build`.
3. Add the variables from `.env.example` to the production environment. Use your actual HTTPS domain for `NEXT_PUBLIC_APP_URL` and a stable `BETTER_AUTH_SECRET`.
4. Enable Atlas network connectivity, SMTP delivery, and a funded OpenRouter key. Use a hosting plan that supports the AI route's 60-second duration.
5. Deploy, then run the launch checklist against the production domain.

Atlas stores cloud data; Vercel functions connect through the pooled MongoDB client. Public user sites are marked `noindex` and excluded from the sitemap until an abuse-moderation and custom-domain strategy is in place.

### Public launch checklist

- [ ] Verify signup, email confirmation, login/logout, password recovery, and session revocation with your SMTP provider.
- [ ] Generate a site with the actual OpenRouter key; confirm model availability and your account spending limit.
- [ ] Create, save, reload, publish, update, unpublish, export, and delete a site on the production domain.
- [ ] Confirm two accounts cannot read or change each other's projects.
- [ ] Replace legal policy drafts with your operator identity, privacy contact, retention policy, and applicable terms.
- [ ] Enable Atlas backups, production monitoring, and Vercel error alerts.
- [ ] Review naming/domain availability before using Forma as a commercial brand.

## Supported features and limits

**Editor:** single-page sites, editable text, sections, columns, buttons/links, remote images, YouTube embeds, layers, ordering, duplication, drag-in insertion, undo/redo, device preview, manual saving, and HTML export. Unsaved changes trigger guards when leaving the editor or closing the browser.

**Not implemented:** billing, built-in checkout, file uploads, custom-domain binding, or multi-page site routing. Exported HTML still depends on external URLs for remote images and videos.

The local demo replaces the prototype's shared Redux persisted canvas. Old prototype browser state is not automatically migrated.
