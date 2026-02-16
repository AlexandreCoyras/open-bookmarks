import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Providers } from '@/components/providers'
import { routing } from '@/i18n/routing'
import '../globals.css'

const inter = Inter({
	variable: '--font-sans',
	subsets: ['latin'],
})

const playfair = Playfair_Display({
	variable: '--font-serif',
	subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
	variable: '--font-mono',
	subsets: ['latin'],
})

const baseUrl =
	process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.openbookmarks.app'

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params

	const descriptions: Record<string, string> = {
		en: 'Save and organize your bookmarks, synced across all your devices.',
		fr: 'Sauvegardez et organisez vos favoris, synchronisés entre tous vos appareils.',
	}

	return {
		title: 'Open Bookmarks',
		description: descriptions[locale] ?? descriptions.en,
		manifest: '/manifest.webmanifest',
		appleWebApp: {
			capable: true,
			statusBarStyle: 'default',
			title: 'Open Bookmarks',
		},
		alternates: {
			canonical: `${baseUrl}/${locale}`,
			languages: {
				en: `${baseUrl}/en`,
				fr: `${baseUrl}/fr`,
			},
		},
		openGraph: {
			locale,
			alternateLocale: routing.locales.filter((l) => l !== locale),
		},
	}
}

export const viewport: Viewport = {
	themeColor: '#000000',
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params

	if (!routing.locales.includes(locale as 'en' | 'fr')) {
		notFound()
	}

	setRequestLocale(locale)
	const messages = await getMessages()

	return (
		<html lang={locale} suppressHydrationWarning>
			<body
				className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased`}
			>
				<NextIntlClientProvider messages={messages}>
					<Providers>{children}</Providers>
				</NextIntlClientProvider>
				<Analytics />
			</body>
		</html>
	)
}
