'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'

export function LandingHeader({
	isAuthenticated,
}: {
	isAuthenticated: boolean
}) {
	const [scrolled, setScrolled] = useState(false)
	const t = useTranslations('Landing')

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 50)
		}

		handleScroll()
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				scrolled
					? 'bg-background/80 backdrop-blur-xl border-b border-border'
					: 'bg-transparent'
			}`}
		>
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
				<Link href="/" className="font-serif text-xl font-bold">
					Open Bookmarks
				</Link>

				<nav className="flex items-center gap-2">
					<LocaleSwitcher />
					{isAuthenticated ? (
						<Button asChild>
							<Link href="/dashboard">{t('dashboard')}</Link>
						</Button>
					) : (
						<>
							<Button variant="ghost" asChild>
								<Link href="/login">{t('signIn')}</Link>
							</Button>
							<Button asChild>
								<Link href="/register">{t('getStartedBtn')}</Link>
							</Button>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}
