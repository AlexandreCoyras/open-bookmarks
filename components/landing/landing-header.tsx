'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'

export function LandingHeader() {
	const { data: session, isPending } = useSession()
	const [scrolled, setScrolled] = useState(false)

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

				{!isPending && (
					<nav className="flex items-center gap-2">
						{session?.user ? (
							<Button asChild>
								<Link href="/dashboard">Tableau de bord</Link>
							</Button>
						) : (
							<>
								<Button variant="ghost" asChild>
									<Link href="/login">Connexion</Link>
								</Button>
								<Button asChild>
									<Link href="/register">Commencer</Link>
								</Button>
							</>
						)}
					</nav>
				)}
			</div>
		</header>
	)
}
