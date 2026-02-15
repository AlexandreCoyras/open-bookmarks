import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export type FolderAccess = {
	access: 'owner' | 'editor' | 'viewer'
	ownerId: string
}

const ROLE_HIERARCHY = { owner: 3, editor: 2, viewer: 1 } as const

/**
 * Walks up the folder hierarchy (CTE, max 20 levels) and returns the first
 * matching access for `userId`: direct ownership → folderCollaborator row.
 * Returns `null` when the user has no access at all.
 */
export async function getFolderAccess(
	userId: string,
	folderId: string,
): Promise<FolderAccess | null> {
	const result = await db.execute(sql`
		WITH RECURSIVE ancestors AS (
			SELECT id, user_id, parent_id, 0 AS depth
			FROM folder
			WHERE id = ${folderId}
			UNION ALL
			SELECT f.id, f.user_id, f.parent_id, a.depth + 1
			FROM folder f
			JOIN ancestors a ON f.id = a.parent_id
			WHERE a.depth < 20
		)
		SELECT
			a.id        AS "folderId",
			a.user_id   AS "ownerId",
			a.depth,
			CASE
				WHEN a.user_id = ${userId} THEN 'owner'
				ELSE fc.role
			END AS access
		FROM ancestors a
		LEFT JOIN folder_collaborator fc
			ON fc.folder_id = a.id AND fc.user_id = ${userId}
		WHERE a.user_id = ${userId} OR fc.id IS NOT NULL
		ORDER BY a.depth ASC
		LIMIT 1
	`)

	if (result.rows.length === 0) return null

	const row = result.rows[0] as {
		folderId: string
		ownerId: string
		depth: number
		access: 'owner' | 'editor' | 'viewer'
	}

	// The ownerId we want is always the folder owner from the target folder (depth 0)
	// but we need the actual owner of the root folder hierarchy
	const ownerResult = await db.execute(sql`
		SELECT user_id AS "ownerId" FROM folder WHERE id = ${folderId}
	`)

	if (ownerResult.rows.length === 0) return null

	const ownerId = (ownerResult.rows[0] as { ownerId: string }).ownerId

	return {
		access: row.access,
		ownerId,
	}
}

/**
 * Like `getFolderAccess` but throws a 403-compatible error when the user
 * lacks `minimumRole` access (or has no access at all).
 */
export async function requireFolderAccess(
	userId: string,
	folderId: string,
	minimumRole: 'owner' | 'editor' | 'viewer',
): Promise<FolderAccess> {
	const access = await getFolderAccess(userId, folderId)

	if (!access || ROLE_HIERARCHY[access.access] < ROLE_HIERARCHY[minimumRole]) {
		throw new FolderAccessError()
	}

	return access
}

export class FolderAccessError extends Error {
	status = 403 as const
	constructor() {
		super('Forbidden')
	}
}
