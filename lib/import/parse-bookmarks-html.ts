export type ParsedBookmark = {
	url: string
	title: string
}

export type ParsedFolder = {
	name: string
	children: ParsedFolder[]
	bookmarks: ParsedBookmark[]
}

export function parseBookmarksHtml(html: string): ParsedFolder {
	const lines = html.split('\n')
	const root: ParsedFolder = { name: '', children: [], bookmarks: [] }
	const stack: ParsedFolder[] = [root]

	for (const line of lines) {
		const trimmed = line.trim()

		// New folder: <DT><H3 ...>Folder Name</H3>
		const folderMatch = trimmed.match(/<dt><h3[^>]*>(.+?)<\/h3>/i)
		if (folderMatch) {
			const folder: ParsedFolder = {
				name: decodeHtmlEntities(folderMatch[1]),
				children: [],
				bookmarks: [],
			}
			const current = stack[stack.length - 1]
			current.children.push(folder)
			stack.push(folder)
			continue
		}

		// Bookmark: <DT><A HREF="..." ...>Title</A>
		const bookmarkMatch = trimmed.match(
			/<dt><a\s+[^>]*href="([^"]+)"[^>]*>(.+?)<\/a>/i,
		)
		if (bookmarkMatch) {
			const url = decodeHtmlEntities(bookmarkMatch[1])
			const title = decodeHtmlEntities(bookmarkMatch[2])
			const current = stack[stack.length - 1]
			current.bookmarks.push({ url, title })
			continue
		}

		// Close folder: </DL>
		if (/<\/dl>/i.test(trimmed)) {
			if (stack.length > 1) {
				stack.pop()
			}
		}
	}

	return root
}

function decodeHtmlEntities(str: string): string {
	return str
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
}
