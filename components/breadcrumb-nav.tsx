'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import { DroppableBreadcrumbItem } from '@/components/droppable-breadcrumb-item'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useBreadcrumb } from '@/lib/hooks/use-folders'

export function BreadcrumbNav({
	currentName,
	folderId,
}: {
	currentName: string
	folderId: string
}) {
	const { data: ancestors } = useBreadcrumb(folderId)

	// All ancestors except the last one (which is the current folder)
	const parents = ancestors?.slice(0, -1)

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<DroppableBreadcrumbItem folderId={null}>
						<BreadcrumbLink asChild>
							<Link href="/">
								<Home className="size-4" />
							</Link>
						</BreadcrumbLink>
					</DroppableBreadcrumbItem>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				{parents?.map((parent) => (
					<span key={parent.id} className="contents">
						<BreadcrumbItem>
							<DroppableBreadcrumbItem folderId={parent.id}>
								<BreadcrumbLink asChild>
									<Link href={`/folders/${parent.id}`}>{parent.name}</Link>
								</BreadcrumbLink>
							</DroppableBreadcrumbItem>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</span>
				))}
				<BreadcrumbItem>
					<BreadcrumbPage>{currentName}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	)
}
