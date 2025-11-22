# Next.js 15 AI Chat Application

## Project Overview

This is a modern, efficient AI chat application built with Next.js 15, showcasing the latest features and best practices in web development. It's designed to be a rapid prototype for validating ideas, with a focus on simplicity, flexibility, and ease of deployment.

## Key Features and Advantages

1. **Next.js 15 Framework**: Leverages the latest features of Next.js, including React Server Components (RSC), Server Actions, and more.

2. **Minimalist Approach**: No additional request libraries included, allowing developers to integrate their preferred solutions (e.g., react-query, SWR, GraphQL, useRequest).

3. **Unified Frontend and Backend**: A monolithic approach that simplifies development, reduces context switching, and streamlines the idea validation process.

4. **Easy Deployment**: Includes Dockerfile and docker-compose configurations for straightforward deployment. Compatible with services like Cloudflare for quick setup.

5. **Customizable UI with Radix UI**: Utilizes Radix UI components as needed, offering a flexible and extensible design system.

6. **Core Business Logic**: Implements essential features including login, subscription management, payment processing, AI chat functionality, and necessary legal agreements (refund policy, user agreement, subscription terms, company information, contact details).

7. **Theme Support**: Includes both light and dark theme options for enhanced user experience.

8. **Database-Backed Knowledge Base**: Articles live in Cloudflare D1 (SQLite) via Drizzle ORM, enabling search, filtering, translations, and automation beyond the limits of static files.

9. **Built-In Editor**: An authenticated admin workspace lets you create, edit, publish, and delete posts with a live Markdown preview—no external CMS or MDX pipeline required.

## Tech Stack

- Next.js 15
- React
- TypeScript
- Radix UI
- Drizzle ORM
- NextAuth
- OpenAI / OpenRouter
- Cloudflare D1 (SQLite)
- Docker

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- Docker and docker-compose (for deployment)
- Cloudflare account with Wrangler CLI configured (for D1 database access)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Shiinama/easy-business-ai
   cd easy-business-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the necessary environment variables (database URL, API keys, etc.).

### Cloudflare D1 Setup

1. Install the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and run `wrangler login`.
2. Create a D1 database (or reuse an existing one):

   ```bash
   wrangler d1 create link-ai-db
   ```

3. Copy the output values into your `.env` file:

   ```bash
   DATABASE_NAME="link-ai-db"
   DATABASE_ID="<the UUID shown by Wrangler>"
   CLOUDFLARE_ACCOUNT_ID="<your account id>"
   CLOUDFLARE_API_TOKEN="<an API token with D1 access>"
   ```

   The HTTP proxy automatically sends local Node.js queries (Next.js dev server, scripts, etc.) to Cloudflare's D1 API, so you no longer need a local Postgres service.

4. Set up the Cloudflare D1 schema (one-time). Generate SQL (optional) and push it to your database (Wrangler credentials are picked up from `.env`):

   ```bash
   pnpm db:generate   # optional – creates a migration snapshot
   pnpm db:push       # applies the schema using Drizzle Kit
   ```

5. (Optional) Import the legacy MDX articles into the database:

   ```bash
   pnpm content:import
   ```

6. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Docker / Traditional VM

1. Build the Docker image:

   ```bash
   docker build -t your-app-name .
   ```

2. Run the application using docker-compose:

   ```bash
   docker-compose up -d
   ```

3. Configure your server's security group to allow incoming traffic.

4. Add an A record in Cloudflare pointing to your server's IP address.

### Cloudflare Workers (OpenNext)

This repo now ships with the same OpenNext + Cloudflare architecture as `next-cloudflare-template`. To deploy to Workers:

1. Edit `wrangler.jsonc` with your Cloudflare account/binding names.
2. Generate typed bindings when they change (optional, but helpful):

   ```bash
   pnpm cf:typegen
   ```

3. Build and run a local Worker preview (uses `.open-next` outputs and Wrangler):

   ```bash
   pnpm preview
   ```

4. Deploy the latest build to Cloudflare:

   ```bash
   pnpm deploy
   ```

5. To upload the Worker bundle without deployment (CI/bucket workflows), run:

   ```bash
   pnpm upload
   ```

Behind the scenes `opennextjs-cloudflare` generates `.open-next/worker.js`, and `worker.ts` simply forwards requests to it while exposing any custom Durable Objects when needed.

Certainly! I'll update the Project Structure section of the README based on the current project structure. Here's the updated section:

**File: /Users/weishunyu/ChatGPT/README.md**

## Project Structure

```
.
├── actions/                  # Next server actions (auth, posts, AI helpers)
├── app/
│   ├── (document)/           # Public blog UI
│   ├── admin/                # Database-backed editor + dashboard
│   └── api/                  # NextAuth routes and other APIs
├── components/
│   ├── markdown/             # Runtime Markdown renderer
│   ├── mdx/                  # Legacy helpers (TOC, sidebar shell)
│   └── posts/                # Admin form + table components
├── constant/
│   └── category-presets.ts   # Central definition of blog categories
├── content/                  # Legacy MDX sources (import with `pnpm content:import`)
├── hooks/                    # Reusable client hooks
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── authz.ts              # Admin guards
│   ├── db/                   # Cloudflare D1 driver + schema exports
│   ├── markdown/             # TOC + slug helpers
│   └── posts.ts              # Drizzle queries for posts/categories
├── drizzle/
│   ├── schema.ts             # Drizzle ORM schema (shared across runtimes)
│   └── migrations/           # Generated SQL snapshots
├── public/
├── scripts/
│   └── import-content.ts     # CLI to migrate MDX into the database
├── styles/
├── constant.json / messages/
├── cloudflare-env.d.ts       # Worker bindings (type-safe)
├── worker.ts                 # Cloudflare Worker entry that delegates to OpenNext
├── wrangler.jsonc            # Wrangler configuration/bindings
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

- `content/` now serves only as an import source. Once `pnpm content:import` has been run, day-to-day writing happens in the admin UI and the database.
- `app/admin` contains the gated dashboard for listing, creating, editing, publishing, and deleting posts.
- `scripts/import-content.ts` normalizes the legacy MDX tree, keeps existing slugs, and hydrates the new Drizzle tables.
- `constant/category-presets.ts` is the single source of truth for category metadata (slug, translation key, visibility, order).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact Me

If you need a more customized implementation or have interesting commercial projects, I'd love to hear from you. You can reach me via email:

- Email: [contact@xibaoyu.xyz](mailto:contact@xibaoyu.xyz)

Feel free to get in touch if you have any questions, need assistance with implementation, or want to discuss potential collaborations. I'm always open to exciting new projects and opportunities!
