# Forma

Read the relevant Next.js 16 documentation in `node_modules/next/dist/docs/` before changing framework code.

The app uses MongoDB Atlas, Better Auth, and OpenRouter, and deploys to Vercel. Always enforce ownership in server APIs. The local demo is explicit and never grants cloud access. Page content is validated with `lib/site.ts` before saving, rendering a published snapshot, or exporting.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before finishing changes. Keep the existing Linear reference in DESIGN.md intact.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
