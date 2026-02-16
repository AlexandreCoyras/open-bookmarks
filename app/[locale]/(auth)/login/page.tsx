import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LoginForm } from './login-form'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	await params
	const t = await getTranslations('Metadata')
	return {
		title: t('loginTitle'),
		description: t('loginDescription'),
	}
}

export default async function LoginPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale)

	return <LoginForm />
}
