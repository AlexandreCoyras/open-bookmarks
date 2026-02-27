import type { IdMapEntry } from '../types'

export type ConflictWinner = 'chrome' | 'ob'

export function resolveConflict(
	mapping: IdMapEntry,
	obUpdatedAt: string,
): ConflictWinner {
	const chromeTime = new Date(mapping.updatedAt).getTime()
	const obTime = new Date(obUpdatedAt).getTime()

	return obTime > chromeTime ? 'ob' : 'chrome'
}
