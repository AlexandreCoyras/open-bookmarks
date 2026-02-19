/**
 * Helper to build Request objects for Elysia `.handle()`.
 */

const BASE = 'http://localhost'

type RequestOptions = {
	method?: string
	body?: unknown
	query?: Record<string, string>
	headers?: Record<string, string>
}

export function createRequest(
	path: string,
	options: RequestOptions = {},
): Request {
	const { method = 'GET', body, query, headers = {} } = options

	const url = new URL(path, BASE)
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			url.searchParams.set(key, value)
		}
	}

	const init: RequestInit = { method, headers: new Headers(headers) }

	if (body !== undefined) {
		if (body instanceof FormData) {
			init.body = body
		} else {
			;(init.headers as Headers).set('content-type', 'application/json')
			init.body = JSON.stringify(body)
		}
	}

	return new Request(url.toString(), init)
}
