import { and, eq, inArray, sql } from 'drizzle-orm'
import { bookmarkTag, tag } from '@/drizzle/schema'
import { db } from '@/lib/db'

export async function upsertTags(
	tagNames: string[],
	userId: string,
): Promise<string[]> {
	const normalized = [
		...new Set(tagNames.map((n) => n.trim().toLowerCase()).filter(Boolean)),
	]
	if (normalized.length === 0) return []

	await db
		.insert(tag)
		.values(normalized.map((name) => ({ name, userId })))
		.onConflictDoNothing({ target: [tag.userId, tag.name] })

	const rows = await db
		.select({ id: tag.id })
		.from(tag)
		.where(
			and(
				eq(tag.userId, userId),
				sql`${tag.name} IN (${sql.join(
					normalized.map((n) => sql`${n}`),
					sql`, `,
				)})`,
			),
		)

	return rows.map((r) => r.id)
}

export async function syncBookmarkTags(
	bookmarkId: string,
	tagIds: string[],
): Promise<void> {
	const existing = await db
		.select({ tagId: bookmarkTag.tagId })
		.from(bookmarkTag)
		.where(eq(bookmarkTag.bookmarkId, bookmarkId))

	const existingSet = new Set(existing.map((r) => r.tagId))
	const targetSet = new Set(tagIds)

	const toAdd = tagIds.filter((id) => !existingSet.has(id))
	const toRemove = existing
		.map((r) => r.tagId)
		.filter((id) => !targetSet.has(id))

	const ops: Promise<unknown>[] = []

	if (toAdd.length > 0) {
		ops.push(
			db
				.insert(bookmarkTag)
				.values(toAdd.map((tagId) => ({ bookmarkId, tagId })))
				.onConflictDoNothing(),
		)
	}

	if (toRemove.length > 0) {
		ops.push(
			db
				.delete(bookmarkTag)
				.where(
					and(
						eq(bookmarkTag.bookmarkId, bookmarkId),
						inArray(bookmarkTag.tagId, toRemove),
					),
				),
		)
	}

	await Promise.all(ops)

	// Delete orphaned tags (no longer used by any bookmark)
	if (toRemove.length > 0) {
		await db
			.delete(tag)
			.where(
				and(
					inArray(tag.id, toRemove),
					sql`${tag.id} NOT IN (SELECT ${bookmarkTag.tagId} FROM ${bookmarkTag})`,
				),
			)
	}
}

export async function getBookmarkTags(
	bookmarkIds: string[],
): Promise<Map<string, { id: string; name: string }[]>> {
	const result = new Map<string, { id: string; name: string }[]>()
	if (bookmarkIds.length === 0) return result

	const rows = await db
		.select({
			bookmarkId: bookmarkTag.bookmarkId,
			tagId: tag.id,
			tagName: tag.name,
		})
		.from(bookmarkTag)
		.innerJoin(tag, eq(tag.id, bookmarkTag.tagId))
		.where(inArray(bookmarkTag.bookmarkId, bookmarkIds))

	for (const row of rows) {
		const list = result.get(row.bookmarkId) ?? []
		list.push({ id: row.tagId, name: row.tagName })
		result.set(row.bookmarkId, list)
	}

	return result
}
