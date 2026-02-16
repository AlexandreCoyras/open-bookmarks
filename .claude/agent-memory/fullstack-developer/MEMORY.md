# Agent Memory

## i18n Architecture (next-intl)
- Routing config: `i18n/routing.ts` (locales: en/fr, defaultLocale: en, localePrefix: always)
- Request config: `i18n/request.ts` (loads messages from `messages/{locale}.json`)
- Navigation helpers: `lib/navigation.ts` exports `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`
- Translation files: `messages/en.json` and `messages/fr.json`
- Namespaces: Metadata, Landing, Auth, Dashboard, Bookmark, Folder, DeleteFolder, DeleteBookmark, Share, Collaborators, Import, Avatar, Search, Selection, Header, Offline, Public, ContextMenu, Toast, FolderPicker, SharedFolders, Manifest
- Server components: use `getTranslations` from `next-intl/server` + `setRequestLocale(locale)`
- Client components: use `useTranslations` from `next-intl`
- All page/layout components under `app/[locale]/` must accept `params: Promise<{ locale: string; ... }>` and call `setRequestLocale(locale)`

## Import Paths After i18n Migration
- Files moved from `app/` to `app/[locale]/` need updated cross-references
- Example: `@/app/[locale]/dashboard/home-content` (not `@/app/dashboard/home-content`)
- Example: `@/app/[locale]/(public)/s/[slug]/public-folder-content`

## Key Conventions
- Server-side redirect: `import { redirect } from '@/lib/navigation'` (auto-prefixes locale)
- Client-side Link/router: `import { Link, useRouter } from '@/lib/navigation'`
- OAuth callbackURL: keep as `/dashboard` (middleware handles locale prefix)
- `biome check --write .` handles import sorting and formatting
