'use client'

import { User } from 'lucide-react'
import { BookmarkCard, type BookmarkData } from '@/components/bookmark-card'
import { FolderCard, type FolderData } from '@/components/folder-card'
import { PublicBreadcrumbNav } from '@/components/public-breadcrumb-nav'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
	usePublicBookmarks,
	usePublicBreadcrumb,
	usePublicFolder,
	usePublicSubfolders,
} from '@/lib/hooks/use-public-folders'

export function PublicFolderContent({
	slug,
	folderId,
}: {
	slug: string
	folderId?: string
}) {
	const { data: publicFolder, isLoading } = usePublicFolder(slug)
	const { data: subfolders } = usePublicSubfolders(slug, folderId)
	const { data: bookmarks } = usePublicBookmarks(slug, folderId)
	const { data: breadcrumb } = usePublicBreadcrumb(slug, folderId)

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-8 w-64" />
			</div>
		)
	}

	if (
		!publicFolder ||
		typeof publicFolder !== 'object' ||
		!('id' in publicFolder)
	) {
		return <p className="text-muted-foreground">Dossier introuvable.</p>
	}

	const currentName = folderId
		? (breadcrumb?.at(-1)?.name ?? '')
		: publicFolder.name

	return (
		<div className="space-y-6">
			<PublicBreadcrumbNav
				slug={slug}
				rootName={publicFolder.name}
				currentName={currentName}
				folderId={folderId}
			/>

			<div className="flex items-center gap-3">
				<Avatar className="size-8">
					<AvatarImage
						src={publicFolder.owner.image ?? undefined}
						alt={publicFolder.owner.name}
					/>
					<AvatarFallback>
						<User className="size-4" />
					</AvatarFallback>
				</Avatar>
				<span className="text-sm text-muted-foreground">
					{publicFolder.owner.name}
				</span>
			</div>

			{subfolders && (subfolders as FolderData[]).length > 0 && (
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{(subfolders as FolderData[]).map((f) => (
						<FolderCard
							key={f.id}
							folder={f}
							readOnly
							href={`/s/${slug}/f/${f.id}`}
						/>
					))}
				</div>
			)}

			<Separator />

			{bookmarks && (bookmarks as BookmarkData[]).length > 0 ? (
				<div className="space-y-2">
					{(bookmarks as BookmarkData[]).map((b) => (
						<BookmarkCard key={b.id} bookmark={b} readOnly />
					))}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">Aucun favori.</p>
			)}
		</div>
	)
}
