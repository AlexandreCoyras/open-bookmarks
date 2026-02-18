import { and, eq, ilike, or } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { bookmark, bookmarkTag, folder, tag } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

export const searchRoutes = new Elysia({ prefix: '/search' })
	.use(authPlugin)
	.get(
		'/',
		async ({ user, query }) => {
			const term = `%${query.q}%`

			const [folders, textBookmarks, tagBookmarks] = await Promise.all([
				db
					.select({
						id: folder.id,
						name: folder.name,
						color: folder.color,
						icon: folder.icon,
						parentId: folder.parentId,
					})
					.from(folder)
					.where(and(eq(folder.userId, user.id), ilike(folder.name, term)))
					.limit(10),
				db
					.select({
						id: bookmark.id,
						url: bookmark.url,
						title: bookmark.title,
						description: bookmark.description,
						favicon: bookmark.favicon,
						folderId: bookmark.folderId,
					})
					.from(bookmark)
					.where(
						and(
							eq(bookmark.userId, user.id),
							or(
								ilike(bookmark.title, term),
								ilike(bookmark.url, term),
								ilike(bookmark.description, term),
							),
						),
					)
					.limit(10),
				db
					.select({
						id: bookmark.id,
						url: bookmark.url,
						title: bookmark.title,
						description: bookmark.description,
						favicon: bookmark.favicon,
						folderId: bookmark.folderId,
						matchedTag: tag.name,
					})
					.from(tag)
					.innerJoin(bookmarkTag, eq(bookmarkTag.tagId, tag.id))
					.innerJoin(bookmark, eq(bookmark.id, bookmarkTag.bookmarkId))
					.where(and(eq(tag.userId, user.id), ilike(tag.name, term)))
					.limit(10),
			])

			// Merge and deduplicate bookmarks
			const seen = new Set<string>()
			const bookmarks: {
				id: string
				url: string
				title: string
				description: string | null
				favicon: string | null
				folderId: string | null
				matchedTag: string | null
			}[] = []

			for (const b of textBookmarks) {
				seen.add(b.id)
				bookmarks.push({ ...b, matchedTag: null })
			}
			for (const b of tagBookmarks) {
				if (!seen.has(b.id)) {
					seen.add(b.id)
					bookmarks.push(b)
				}
			}

			const folderIdsForContext = new Set<string>()
			for (const f of folders) {
				if (f.parentId) folderIdsForContext.add(f.parentId)
			}
			for (const b of bookmarks) {
				if (b.folderId) folderIdsForContext.add(b.folderId)
			}

			const folderNames = new Map<string, string>()
			if (folderIdsForContext.size > 0) {
				const ids = [...folderIdsForContext]
				const parentFolders = await db
					.select({ id: folder.id, name: folder.name })
					.from(folder)
					.where(
						and(
							eq(folder.userId, user.id),
							or(...ids.map((id) => eq(folder.id, id))),
						),
					)
				for (const pf of parentFolders) {
					folderNames.set(pf.id, pf.name)
				}
			}

			return {
				folders: folders.map((f) => ({
					...f,
					parentName: f.parentId ? (folderNames.get(f.parentId) ?? null) : null,
				})),
				bookmarks: bookmarks.map((b) => ({
					...b,
					folderName: b.folderId ? (folderNames.get(b.folderId) ?? null) : null,
				})),
			}
		},
		{
			auth: true,
			query: t.Object({
				q: t.String({ minLength: 2 }),
			}),
		},
	)
