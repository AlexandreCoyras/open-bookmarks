import { del, put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { user } from '@/drizzle/schema'
import { db } from '@/lib/db'
import { authPlugin } from '@/server/auth-middleware'

const MAX_SIZE = 2 * 1024 * 1024 // 2 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function getEnvPrefix() {
	return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
}

function isVercelBlobUrl(url: string) {
	return url.includes('.public.blob.vercel-storage.com')
}

export const avatarRoutes = new Elysia({ prefix: '/avatar' })
	.use(authPlugin)
	.post(
		'/upload',
		async ({ user: currentUser, body, status }) => {
			const file = body.file

			if (!ALLOWED_TYPES.includes(file.type)) {
				return status(400, {
					error:
						'Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.',
				})
			}

			if (file.size > MAX_SIZE) {
				return status(400, {
					error: 'Le fichier est trop volumineux. Taille maximale : 2 Mo.',
				})
			}

			const ext =
				file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
			const env = getEnvPrefix()
			const pathname = `avatars/${env}/${currentUser.id}.${ext}`

			// Delete old blob if it's a Vercel Blob URL
			if (currentUser.image && isVercelBlobUrl(currentUser.image)) {
				try {
					await del(currentUser.image)
				} catch {
					// Ignore deletion errors
				}
			}

			const blob = await put(pathname, file, {
				access: 'public',
				addRandomSuffix: true,
			})

			await db
				.update(user)
				.set({ image: blob.url })
				.where(eq(user.id, currentUser.id))

			return { url: blob.url }
		},
		{
			auth: true,
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.delete(
		'/',
		async ({ user: currentUser }) => {
			if (currentUser.image && isVercelBlobUrl(currentUser.image)) {
				try {
					await del(currentUser.image)
				} catch {
					// Ignore deletion errors
				}
			}

			await db
				.update(user)
				.set({ image: null })
				.where(eq(user.id, currentUser.id))

			return { url: null }
		},
		{
			auth: true,
		},
	)
