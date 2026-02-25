'use client'

import { useParams } from 'next/navigation'
import { FolderContent } from '@/app/[locale]/dashboard/folders/[id]/folder-content'

export default function FolderPage() {
	const { id } = useParams<{ id: string }>()
	return <FolderContent id={id} />
}
