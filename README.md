# Open Bookmarks

All your bookmarks, organized and accessible everywhere.

Open Bookmarks is an open-source PWA for saving, organizing, and syncing bookmarks across all your devices. It works offline, supports collaboration, and lets you share folders publicly.

**[openbookmarks.app](https://www.openbookmarks.app)**

## Features

- **Nested folders** with drag-and-drop reordering (mouse, touch, keyboard)
- **Cross-device sync** via server-backed storage
- **Offline mode** with Service Worker caching and IndexedDB persistence
- **Public sharing** of folders via unique links (`/s/{slug}`)
- **Collaboration** — invite users as Viewer or Editor on any folder
- **Tags** on bookmarks for flexible categorization
- **Search** — global `Cmd+K` palette across folders, bookmarks, and tags
- **Import/Export** from Chrome and Firefox (Netscape HTML format)
- **Dark mode** with system preference detection
- **i18n** — English and French
- **Installable PWA** — works as a standalone app on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Frontend | [Next.js 16](https://nextjs.org) (App Router), [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com) |
| UI Components | [shadcn/ui](https://ui.shadcn.com), [Lucide](https://lucide.dev) icons |
| Data Fetching | [TanStack React Query](https://tanstack.com/query) + [Eden](https://elysiajs.com/eden/overview) (type-safe RPC) |
| Drag & Drop | [dnd-kit](https://dndkit.com) |
| Backend | [Elysia](https://elysiajs.com) (via Next.js route handler) |
| Database | PostgreSQL ([Neon](https://neon.tech)) + [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [Better Auth](https://www.better-auth.com) (email/password, GitHub, Google) |
| PWA | [Serwist](https://serwist.pages.dev) + [idb-keyval](https://github.com/nicolo-ribaudo/idb-keyval) |
| Linter/Formatter | [Biome](https://biomejs.dev) |
| Hosting | [Vercel](https://vercel.com) (app) + [Neon](https://neon.tech) (database) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- PostgreSQL database (or a [Neon](https://neon.tech) free tier)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/open-bookmarks.git
cd open-bookmarks
```

2. Install dependencies:

```bash
bun install
```

3. Create a `.env.local` file from the example:

```bash
cp .env.example .env.local
```

4. Fill in the environment variables:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — OAuth providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional — avatar uploads
BLOB_READ_WRITE_TOKEN=
```

5. Run database migrations:

```bash
bun db:migrate
```

6. Start the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
bun dev              # Dev server (Turbopack)
bun run build            # Production build
bun start            # Start production server
bun lint             # Lint (Biome)
bun format           # Format (Biome)
bun check            # Lint + format check
bun db:generate      # Generate Drizzle migrations
bun db:migrate       # Apply migrations
bun db:studio        # Drizzle Studio
bun test             # Run tests
```

## Project Structure

```
app/
  [locale]/
    (auth)/             Login, register
    (landing)/          Landing page
    (public)/s/[slug]/  Public shared folders
    dashboard/          Main app (folders, bookmarks)
  api/[[...slugs]]/     Elysia catch-all route handler
server/
  routes/               API route modules (bookmarks, folders, tags, etc.)
  app.ts                Elysia app composition
lib/
  hooks/                React Query hooks
  eden.ts               Type-safe API client
  auth.ts               Better Auth config
  db.ts                 Drizzle client
components/
  ui/                   shadcn/ui primitives
  ...                   Feature components
drizzle/
  schema.ts             Database schema
messages/
  en.json               English translations
  fr.json               French translations
```