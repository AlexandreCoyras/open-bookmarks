import { setRequestLocale } from 'next-intl/server'
import { LocaleSwitcher } from '@/components/locale-switcher'

export default async function AuthLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale)

	return (
		<div className="relative flex min-h-svh items-center justify-center p-4">
			<div className="absolute top-4 right-4">
				<LocaleSwitcher />
			</div>
			{children}
		</div>
	)
}
