import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CtaSection } from '@/components/landing/cta-section'
import { DemoSection } from '@/components/landing/demo-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HeroSection } from '@/components/landing/hero-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeader } from '@/components/landing/landing-header'
import { routing } from '@/i18n/routing'

const baseUrl =
	process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.openbookmarks.app'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations('Metadata')
	return {
		title: t('landingTitle'),
		description: t('landingDescription'),
		alternates: {
			canonical: `${baseUrl}/${locale}`,
			languages: { en: `${baseUrl}/en`, fr: `${baseUrl}/fr` },
		},
		openGraph: {
			locale,
			alternateLocale: routing.locales.filter((l) => l !== locale),
		},
	}
}

export default async function LandingPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale)

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
