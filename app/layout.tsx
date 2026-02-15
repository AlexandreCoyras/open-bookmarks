import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

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

export const metadata: Metadata = {
	title: 'Open Bookmarks',
	description:
		'Sauvegardez et organisez vos favoris, synchronisés entre tous vos appareils.',
	manifest: '/manifest.webmanifest',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Open Bookmarks',
	},
}

export const viewport: Viewport = {
	themeColor: '#000000',
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
