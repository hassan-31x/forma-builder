# Forma

A dark website studio built with Next.js 16, React 19, Tailwind CSS 4, MongoDB Atlas, Better Auth, and OpenRouter. Create an account, start from a template or AI draft, edit visually, save private projects, publish a public snapshot, or export standalone HTML.

## Local development

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Without cloud credentials, `/dashboard?demo=1` offers a clearly labeled local demo. Projects in the demo live only in browser storage. Demo accounts do not exist, and demo AI/publishing do not make cloud requests.

## MongoDB Atlas

1. Create an Atlas cluster and database user with `readWrite` access to the `forma` database. Use a replica set (Atlas clusters support transactions).
2. Set `MONGODB_URI` and `MONGODB_DB`. Keep the URI server only.
3. Configure Atlas network access for your hosting setup. Vercel deployments need to reach the cluster; use restricted egress where available, or Atlas's supported public access with strong database credentials and TLS.
4. Required indexes are created automatically on the first authenticated request. Users cannot query MongoDB directly; all project APIs verify the Better Auth session and filter by its owner ID.

Collections: `user`, `session`, `account`, `verification`, `rateLimit`, `projects`, `published_sites`, `ai_usage`. Public routes read only the published snapshot. Publishing and deleting use transactions to avoid orphaned or inconsistent snapshots. Usage counters have a TTL index.

## Accounts and email

Set `BETTER_AUTH_SECRET` to at least 32 random characters (`openssl rand -base64 32`) and `NEXT_PUBLIC_APP_URL` to the canonical app origin. Add SMTP configuration and a verified `EMAIL_FROM` sender. Production auth requires SMTP and verified email before sign in. Local development can create accounts without SMTP; password recovery still requires email delivery.

Better Auth handles password hashing, session cookies, verification tokens, password recovery, CSRF/origin checks, and database-backed authentication rate limits. Password resets revoke existing sessions. Emails use Next.js `after()` so delivery continues after the response on Vercel. Verify sender DNS, SMTP delivery, and spam placement before public launch.

## OpenRouter

Set `OPENROUTER_API_KEY` on the server. The default is `qwen/qwen3.5-flash-02-23`, selected for low cost. Override `OPENROUTER_MODEL` to change providers/models without frontend changes. No OpenAI account or SDK is needed.

AI generation requires an authenticated account. MongoDB atomically enforces 10 attempts per user per UTC day and at least 10 seconds between requests across server instances. Each attempt, including a provider failure, consumes one credit. Input, output size, tree complexity, URLs, and supported styles are validated. Requests have a 45 second provider timeout and a 7,000 token output cap. Set a spend limit on your OpenRouter key; per-account limits do not cap total spending across all users.

## Deploy on Vercel

1. Import this repository into Vercel as a Next.js project.
2. Choose Node.js 22 or newer. Build: `npm run build`. Install: `npm ci`.
3. Add the variables from `.env.example` to the production environment. Use your actual HTTPS domain in `NEXT_PUBLIC_APP_URL` and a stable `BETTER_AUTH_SECRET`.
4. Enable Atlas network connectivity, SMTP delivery, and a funded OpenRouter key. Redeploy after changing public environment variables.
5. Run the launch checklist below against the production domain.

Atlas stores cloud data. Vercel functions connect through a pooled MongoDB client. The AI route requests a 60 second duration; use a hosting plan supporting it.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
npm run test:integration
```

The integration test starts an ephemeral MongoDB replica set and a separate Next dev server on port 3100. It downloads a MongoDB test binary once. It exercises real signup/sessions, project ownership isolation, cross-origin rejection, malformed page validation, saves, private draft isolation, publish/unpublish, transactional deletion, and concurrent AI quota enforcement. It also verifies password changes and full account deletion. It does not send email or call a paid AI provider.

## Public launch checklist

- Verify email signup, confirmation, login/logout, password recovery, and session revocation with your SMTP provider.
- Generate a website using your actual OpenRouter key and confirm model availability and your account spending limit.
- Create, save, reload, publish, update, unpublish, export, and delete a site on your Vercel domain.
- Confirm two accounts cannot read or change each other's projects.
- Replace the legal policy drafts with your operator identity, privacy contact, retention policy, and applicable terms.
- Enable Atlas backups, production monitoring, and Vercel error alerts.
- Review naming/domain availability before using Forma as a commercial brand.

## Current scope

Single page sites with editable text, sections, columns, buttons/links, remote images, and YouTube embeds. Includes layers, ordering, duplication, drag-in element insertion, undo/redo, device preview, manual saving, and HTML export. Changes are marked unsaved; the app guards leaving the editor and browser close.

There is no billing, built-in checkout, file upload service, custom domain binding, or multi page site routing. Published user sites are `noindex` and excluded from the sitemap until an abuse moderation and custom-domain strategy is in place. The local demo replaces the prototype's shared Redux persisted canvas; old prototype browser state is not automatically migrated.
