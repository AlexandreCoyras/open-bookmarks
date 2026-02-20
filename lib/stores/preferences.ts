import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BookmarkViewMode = 'list' | 'grid'

type PreferencesState = {
	bookmarkViewMode: BookmarkViewMode
	setBookmarkViewMode: (mode: BookmarkViewMode) => void
}

export const usePreferences = create<PreferencesState>()(
	persist(
		(set) => ({
			bookmarkViewMode: 'list',
			setBookmarkViewMode: (mode) => set({ bookmarkViewMode: mode }),
		}),
		{ name: 'open-bookmarks-preferences' },
	),
)
