'use client'

import { Home } from 'lucide-react'
import { DroppableBreadcrumbItem } from '@/components/droppable-breadcrumb-item'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useFolderNavigation } from '@/lib/folder-navigation'
import { useBreadcrumb } from '@/lib/hooks/use-folders'

export function BreadcrumbNav({
	currentName,
	folderId,
}: {
	currentName: string
	folderId: string
}) {
	const { data: ancestors } = useBreadcrumb(folderId)
	const { navigateToFolder, buildHref } = useFolderNavigation()

	// All ancestors except the last one (which is the current folder)
	const parents = ancestors?.slice(0, -1)

	function handleNav(e: React.MouseEvent, id: string | null) {
		if (e.metaKey || e.ctrlKey || e.shiftKey) return
		e.preventDefault()
		navigateToFolder(id)
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<DroppableBreadcrumbItem folderId={null}>
						<BreadcrumbLink asChild>
							<a href={buildHref(null)} onClick={(e) => handleNav(e, null)}>
								<Home className="size-5" />
							</a>
						</BreadcrumbLink>
					</DroppableBreadcrumbItem>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				{parents?.map((parent) => (
					<span key={parent.id} className="contents">
						<BreadcrumbItem>
							<DroppableBreadcrumbItem folderId={parent.id}>
								<BreadcrumbLink asChild>
									<a
										href={buildHref(parent.id)}
										onClick={(e) => handleNav(e, parent.id)}
									>
										{parent.name}
									</a>
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
