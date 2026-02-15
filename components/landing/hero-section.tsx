'use client'

import { motion } from 'motion/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const BookmarkScene = dynamic(
	() => import('@/components/landing/bookmark-scene'),
	{
		ssr: false,
		loading: () => (
			<div className="min-h-[400px] animate-pulse rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20" />
		),
	},
)

const indicators = ['Open source', 'Multi-appareils', 'Collaboration']

export function HeroSection() {
	return (
		<section className="flex min-h-svh items-center pt-24">
			<div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
				<div>
					<motion.h1
						className="font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0 }}
					>
						Tous vos favoris, organisés et accessibles partout.
					</motion.h1>

					<motion.p
						className="mt-6 text-lg text-muted-foreground"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						Sauvegardez, organisez et retrouvez vos favoris en un instant.
						Synchronisés entre tous vos appareils, même hors-ligne.
					</motion.p>

					<motion.div
						className="mt-8 flex gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Button asChild size="lg">
							<Link href="/register">Commencer gratuitement</Link>
						</Button>
						<Button
							variant="outline"
							size="lg"
							onClick={() =>
								document
									.getElementById('features')
									?.scrollIntoView({ behavior: 'smooth' })
							}
						>
							En savoir plus
						</Button>
					</motion.div>

					<motion.div
						className="mt-12 flex flex-wrap gap-6"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						{indicators.map((label) => (
							<span
								key={label}
								className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium"
							>
								{label}
							</span>
						))}
					</motion.div>
				</div>

				<motion.div
					className="hidden min-h-[500px] lg:block"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
				>
					<BookmarkScene />
				</motion.div>
			</div>
		</section>
	)
}
