'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useFolder } from '@/lib/hooks/use-folders'

function ParentBreadcrumb({ parentId }: { parentId: string }) {
	const { data: parent } = useFolder(parentId)

	if (!parent || typeof parent !== 'object' || !('id' in parent)) return null

	return (
		<>
			{parent.parentId && <ParentBreadcrumb parentId={parent.parentId} />}
			<BreadcrumbItem>
				<BreadcrumbLink asChild>
					<Link href={`/folders/${parent.id}`}>{parent.name}</Link>
				</BreadcrumbLink>
			</BreadcrumbItem>
			<BreadcrumbSeparator />
		</>
	)
}

export function BreadcrumbNav({
	currentName,
	parentId,
}: {
	currentName: string
	parentId?: string | null
}) {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link href="/">
							<Home className="size-4" />
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				{parentId && <ParentBreadcrumb parentId={parentId} />}
				<BreadcrumbItem>
					<BreadcrumbPage>{currentName}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
