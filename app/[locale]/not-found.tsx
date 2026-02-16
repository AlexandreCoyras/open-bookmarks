import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'

export default async function NotFound() {
	const t = await getTranslations('NotFound')

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
			<h1 className="text-6xl font-bold">404</h1>
			<h2 className="text-2xl font-semibold">{t('title')}</h2>
			<p className="text-muted-foreground max-w-md">{t('description')}</p>
			<div className="flex gap-3">
				<Button variant="outline" asChild>
					<Link href="/">{t('goHome')}</Link>
				</Button>
				<Button asChild>
					<Link href="/register">{t('createAccount')}</Link>
				</Button>
			</div>
		</div>
	)
}
