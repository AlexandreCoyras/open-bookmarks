import type { OBBookmark, OBFolder, SyncSnapshot } from '../types'
import { OB_PROD_URL, STORAGE_KEYS } from './constants'

async function getBaseUrl(): Promise<string> {
	const result = await chrome.storage.local.get(STORAGE_KEYS.baseUrl)
	return (result[STORAGE_KEYS.baseUrl] as string) || OB_PROD_URL
}

async function getSessionToken(): Promise<{
	value: string
	name: string
} | null> {
	const baseUrl = await getBaseUrl()

	const secureCookie = await chrome.cookies.get({
		url: baseUrl,
		name: '__Secure-better-auth.session_token',
	})
	if (secureCookie)
		return { value: secureCookie.value, name: secureCookie.name }

	const cookie = await chrome.cookies.get({
		url: baseUrl,
		name: 'better-auth.session_token',
	})
	if (cookie) return { value: cookie.value, name: cookie.name }

	return null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const baseUrl = await getBaseUrl()
	const token = await getSessionToken()

	if (!token) {
		throw new ApiError('Not authenticated', 401)
	}

	const url = `${baseUrl}/api${path}`
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Cookie: `${token.name}=${token.value}`,
		...(options.headers as Record<string, string>),
	}

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 15_000)

	try {
		const response = await fetch(url, {
			...options,
			headers,
			signal: controller.signal,
		})

		if (!response.ok) {
			throw new ApiError(response.statusText, response.status)
		}

		return response.json()
	} finally {
		clearTimeout(timeout)
	}
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message)
		this.name = 'ApiError'
	}
}

export const api = {
	async isAuthenticated(): Promise<boolean> {
		return (await getSessionToken()) !== null
	},

	getSnapshot(): Promise<SyncSnapshot> {
		return request('/sync/snapshot')
	},

	createBookmark(body: {
		url: string
		title: string
		description?: string
		favicon?: string
		folderId?: string | null
		position?: number
	}): Promise<OBBookmark> {
		return request('/bookmarks', {
			method: 'POST',
			body: JSON.stringify(body),
		})
	},

	updateBookmark(
		id: string,
		body: {
			url?: string
			title?: string
			folderId?: string | null
			position?: number
		},
	): Promise<OBBookmark> {
		return request(`/bookmarks/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		})
	},

	deleteBookmark(id: string): Promise<{ success: boolean }> {
		return request(`/bookmarks/${id}`, { method: 'DELETE' })
	},

	createFolder(body: {
		name: string
		parentId?: string | null
		position?: number
		color?: string
		icon?: string
	}): Promise<OBFolder> {
		return request('/folders', {
			method: 'POST',
			body: JSON.stringify(body),
		})
	},

	updateFolder(
		id: string,
		body: {
			name?: string
			parentId?: string | null
			position?: number
		},
	): Promise<OBFolder> {
		return request(`/folders/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		})
	},

	deleteFolder(id: string): Promise<{ success: boolean }> {
		return request(`/folders/${id}`, { method: 'DELETE' })
	},

	reorderBookmarks(
		items: { id: string; position: number; folderId?: string | null }[],
	): Promise<{ success: boolean }> {
		return request('/bookmarks/reorder', {
			method: 'PUT',
			body: JSON.stringify({ items }),
		})
	},

	reorderFolders(
		items: { id: string; position: number; parentId?: string | null }[],
	): Promise<{ success: boolean }> {
		return request('/folders/reorder', {
			method: 'PUT',
			body: JSON.stringify({ items }),
		})
	},
}
