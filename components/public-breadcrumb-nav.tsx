'use client'

import { Home } from 'lucide-react'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { usePublicBreadcrumb } from '@/lib/hooks/use-public-folders'
import { Link } from '@/lib/navigation'

export function PublicBreadcrumbNav({
	slug,
	rootName,
	currentName,
	folderId,
}: {
	slug: string
	rootName: string
	currentName: string
	folderId?: string
}) {
	const { data: ancestors } = usePublicBreadcrumb(slug, folderId)

	// ancestors includes from root down to current folder
	// We skip the first one (root folder, shown as Home) and the last one (current folder, shown as BreadcrumbPage)
	const middleCrumbs = ancestors?.slice(1, -1)

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link href="/">
							<Home className="size-5" />
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				{folderId ? (
					<>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link href={`/s/${slug}`}>{rootName}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						{middleCrumbs?.map((crumb) => (
							<span key={crumb.id} className="contents">
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link href={`/s/${slug}/f/${crumb.id}`}>{crumb.name}</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
							</span>
						))}
						<BreadcrumbItem>
							<BreadcrumbPage>{currentName}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				) : (
					<BreadcrumbItem>
						<BreadcrumbPage>{rootName}</BreadcrumbPage>
					</BreadcrumbItem>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
