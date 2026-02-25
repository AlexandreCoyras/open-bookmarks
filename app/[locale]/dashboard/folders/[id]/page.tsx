import { setRequestLocale } from 'next-intl/server'
import { FolderContent } from '@/app/[locale]/dashboard/folders/[id]/folder-content'

export default async function FolderPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	setRequestLocale(locale)

	return <FolderContent id={id} />
}
