import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { del, get, set } from 'idb-keyval'

export const queryPersister = createAsyncStoragePersister({
	storage: {
		getItem: async (key) => (await get(key)) ?? null,
		setItem: (key, value) => set(key, value),
		removeItem: (key) => del(key),
	},
	throttleTime: 1_000,
})
