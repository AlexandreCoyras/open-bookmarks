'use client'

import {
	Code,
	FolderTree,
	RefreshCw,
	Share2,
	Users,
	WifiOff,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'

export function FeaturesSection() {
	const t = useTranslations('Landing')

	const features = [
		{
			icon: FolderTree,
			title: t('featureOrganization'),
			description: t('featureOrganizationDesc'),
		},
		{
			icon: RefreshCw,
			title: t('featureSync'),
			description: t('featureSyncDesc'),
		},
		{
			icon: WifiOff,
			title: t('featureOffline'),
			description: t('featureOfflineDesc'),
		},
		{
			icon: Share2,
			title: t('featureShare'),
			description: t('featureShareDesc'),
		},
		{
			icon: Users,
			title: t('featureCollaboration'),
			description: t('featureCollaborationDesc'),
		},
		{
			icon: Code,
			title: t('featureOpenSource'),
			description: t('featureOpenSourceDesc'),
		},
	]

	return (
		<section id="features" className="py-24">
			<div className="mx-auto max-w-6xl px-4 sm:px-6">
				<div className="text-center">
					<h2 className="font-serif text-3xl font-bold sm:text-4xl">
						{t('featuresTitle')}
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
						{t('featuresDescription')}
					</p>
				</div>

				<div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => (
						<motion.div
							key={feature.title}
							className="h-full"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							viewport={{ once: true }}
						>
							<Card className="h-full">
								<CardContent className="p-6">
									<div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
										<feature.icon className="size-6" />
									</div>
									<h3 className="text-lg font-semibold">{feature.title}</h3>
									<p className="mt-2 text-sm text-muted-foreground">
										{feature.description}
									</p>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	)
}
