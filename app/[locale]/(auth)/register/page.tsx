import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { RegisterForm } from './register-form'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	await params
	const t = await getTranslations('Metadata')
	return {
		title: t('registerTitle'),
		description: t('registerDescription'),
	}
}

export default async function RegisterPage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale)

	return <RegisterForm />
}
