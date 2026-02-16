import { WifiOff } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function OfflinePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale)
	const t = await getTranslations('Offline')

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
			<WifiOff className="text-muted-foreground size-16" />
			<h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
			<p className="text-muted-foreground max-w-sm">{t('pageDescription')}</p>
		</div>
	)
}
