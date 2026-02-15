import type { Metadata } from 'next'
import { CtaSection } from '@/components/landing/cta-section'
import { DemoSection } from '@/components/landing/demo-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HeroSection } from '@/components/landing/hero-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeader } from '@/components/landing/landing-header'

export const metadata: Metadata = {
	title: 'Open Bookmarks — Organisez vos favoris',
	description:
		'Sauvegardez, organisez et synchronisez vos favoris entre tous vos appareils. Open source, hors-ligne, collaboratif.',
}

export default function LandingPage() {
	return (
		<>
			<LandingHeader />
			<HeroSection />
			<FeaturesSection />
			<DemoSection />
			<CtaSection />
			<LandingFooter />
		</>
	)
}
