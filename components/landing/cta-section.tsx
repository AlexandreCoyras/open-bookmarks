'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CtaSection() {
	return (
		<section className="py-24">
			<div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
				>
					<div className="rounded-2xl bg-primary p-8 text-primary-foreground sm:p-12">
						<h2 className="font-serif text-3xl font-bold sm:text-4xl">
							Prêt à organiser vos favoris ?
						</h2>
						<p className="mt-4 text-primary-foreground/80">
							Créez votre compte gratuitement et commencez à sauvegarder vos
							favoris dès maintenant.
						</p>
						<Button asChild variant="secondary" size="lg" className="mt-8">
							<Link href="/register">Créer un compte gratuitement</Link>
						</Button>
					</div>
				</motion.div>
			</div>
		</section>
	)
}
