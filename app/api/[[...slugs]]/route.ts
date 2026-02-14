export const dynamic = 'force-dynamic'

const handler = async (request: Request) => {
	const { default: app } = await import('@/server/app')
	return app.fetch(request)
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
