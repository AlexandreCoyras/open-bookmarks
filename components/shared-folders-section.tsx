'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getFolderIcon } from '@/lib/folder-icons'
import { useSharedFolders } from '@/lib/hooks/use-collaborators'

export function SharedFoldersSection() {
	const { data: sharedFolders } = useSharedFolders()

	if (!sharedFolders || sharedFolders.length === 0) return null

	return (
		<>
			<Separator className="my-6" />
			<div className="space-y-4">
				<h2 className="font-semibold text-xl">Partages avec moi</h2>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
					{sharedFolders.map((item) => {
						const Icon = getFolderIcon(item.folder.icon)
						return (
							<Card key={item.id} className="group relative">
								<CardContent className="flex items-center gap-3 p-3">
									<Icon
										className="size-5 shrink-0"
										style={{
											color: item.folder.color ?? undefined,
										}}
									/>
									<div className="flex-1 min-w-0">
										<Link
											href={`/folders/${item.folder.id}`}
											className="font-medium text-sm hover:underline truncate block after:absolute after:inset-0"
										>
											{item.folder.name}
										</Link>
										<div className="flex items-center gap-1.5 mt-0.5">
											<Avatar className="size-4">
												<AvatarImage src={item.owner.image ?? undefined} />
												<AvatarFallback className="text-[8px]">
													{item.owner.name?.[0]?.toUpperCase() ?? '?'}
												</AvatarFallback>
											</Avatar>
											<span className="text-xs text-muted-foreground truncate">
												{item.owner.name}
											</span>
										</div>
									</div>
									<Badge variant="secondary" className="text-xs shrink-0">
										{item.role === 'editor' ? 'Editeur' : 'Lecteur'}
									</Badge>
								</CardContent>
							</Card>
						)
					})}
				</div>
			</div>
		</>
	)
}
