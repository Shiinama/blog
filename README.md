# Fish Blog

A bilingual (English / 中文) blog with members-only posts, comments, and an admin editor — built on
Next.js 16 (App Router) and deployed to Cloudflare Workers with OpenNext. Live at [xibaoyu.xyz](https://xibaoyu.xyz).

## Stack

| Concern   | Choice                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16.4, React 19.3, TypeScript (strict), Turbopack                                                         |
| Hosting   | Cloudflare Workers via `@opennextjs/cloudflare`; D1 (SQLite), R2, Images, Queues                                 |
| Data      | Drizzle ORM on D1                                                                                                |
| Auth      | Auth.js v5 (Google, GitHub, Resend magic links), JWT sessions + Drizzle adapter                                  |
| i18n      | next-intl 4 with `[locale]` as the root layout and `next/root-params`                                            |
| UI        | Tailwind CSS 4, shadcn/ui (Radix), sonner, motion                                                                |
| Content   | Markdown rendered on the server (GFM, `rehype-highlight`, heading anchors); Tiptap 3 + `@tiptap/markdown` editor |

## How it is put together

```
app/[locale]/          root layout (html lang, providers, navbar) and every page
  page.tsx             post library — filters/search/pagination are URL state (searchParams)
  content/[id]/        article; members-only body and comment form stream in behind <Suspense>
  sign-in/ account/    Auth.js sign-in via Server Actions; account details + membership
  admin/               posts, editor (original + translations), memberships, tools
  rss.xml/             per-locale RSS feed (route handler)
app/api/               auth, image upload (R2), content-signals API, Douyin subtitle tool
actions/               Server Actions — each one authorizes itself and validates input with zod
lib/data/              Data Access Layer (server-only): every read the UI needs, admin reads authorize themselves
lib/session.ts         getViewer() — the signed-in user resolved against the users table, deduped per request
lib/ai-daily.ts        twice-daily AI news post, generated in the Worker's queue consumer
worker.ts              Worker entry: OpenNext fetch handler + cron → queue → AI daily
drizzle/               schema and migrations
```

Principles the code follows:

- **Server-first.** Pages are Server Components; Client Components are leaves (toolbar, forms, menus).
  Reads go through `lib/data/*` (`import 'server-only'`), never through Server Actions.
- **Auth lives in the DAL, not in layouts.** Pages call `requireAdminPage()` (→ `unauthorized()` / `forbidden()`),
  actions and route handlers call `requireAdmin()` / `requireViewer()`. Members-only text is only ever rendered
  for members — the initial HTML holds the preview.
- **Streaming.** Anything that reads the session (user menu, comment form, members-only body) sits behind
  `<Suspense>`, so the rest of the page is never blocked on it.
- **Forms are Server Actions with `useActionState`.** Results are `{ ok } | { ok: false, error, fieldErrors, values }`
  with message keys from `messages/*.json`; failed submissions hand back what was typed.

### Caching

Cache Components (`'use cache'`, Partial Prerendering) are deliberately **off**: on Workers they currently hang
requests ([opennextjs-cloudflare#1464](https://github.com/opennextjs/opennextjs-cloudflare/issues/1464),
[#1450](https://github.com/opennextjs/opennextjs-cloudflare/issues/1450)). Pages render per request against D1
(queries are indexed and fast); mutations call `refresh()`. Revisit when OpenNext ships #1318.

## Data model

`users`, `accounts`, `verification_tokens` (Auth.js) · `categories` · `posts` (original text + `locale`) ·
`post_translations` (one row per extra locale, PK `post_id + locale`) · `comments` · `memberships`
(manually granted by an admin). Timestamps are integer milliseconds.

A post is readable in locale L when it was written in L or has an L translation; `lib/data/posts.ts` resolves
the right title/summary/content in SQL.

## Development

Requires Node.js 22+ and pnpm.

```bash
pnpm install
cp .env.example .env    # fill in the values below
pnpm dev                # D1 and R2 bindings are remote: you work against real data
```

| Variable                                                       | Used for                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| `AUTH_SECRET`                                                  | Auth.js session encryption                                    |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`                        | Google sign-in                                                |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`                        | GitHub sign-in                                                |
| `AUTH_RESEND_KEY`                                              | Email magic links                                             |
| `ADMIN_USER_IDS`                                               | Comma-separated user ids with admin access (server-only)      |
| `CONTENT_SIGNALS_API_KEY`                                      | Bearer key for `GET /api/content-signals`                     |
| `APIFY_TOKEN`, `DOUYIN_SUBTITLE_API_KEY`                       | Douyin subtitle tool (key optional; admins can always use it) |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_DAILY_MODEL`          | AI daily posts                                                |
| `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_R2_DOMAIN`                | Canonical origin; public R2 domain for uploads                |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`                           | Stable Server Action ids across deploys (build time)          |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `DATABASE_ID` | wrangler / drizzle-kit only — never uploaded to the Worker    |

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm format`.

## Database

```bash
pnpm db:generate        # after editing drizzle/schema.ts
pnpm db:migrate:local   # apply to the local D1
pnpm db:migrate         # apply to production
pnpm db:studio          # Drizzle Studio on production
```

## Deploy

```bash
pnpm deploy:prod        # sync runtime secrets → apply migrations → build & deploy → drop stale secrets
pnpm preview            # build and run the Worker locally
```

## Blog CLI

Manage posts from the terminal (local D1 by default, `--remote` for production):

```bash
pnpm blog list --status PUBLISHED
pnpm blog export <id> -o post.md
pnpm blog create -f post.md
pnpm blog publish <id> --remote
```

## Content signals API

`GET /api/content-signals?locale=en&days=30&category=ai&excludeCategory=ai-daily&claimed=false&includeContent=true`
with `Authorization: Bearer $CONTENT_SIGNALS_API_KEY` hands out the oldest unclaimed published post and marks it
claimed (`claimed=true` peeks at an already-claimed one instead).

## License

Apache-2.0
