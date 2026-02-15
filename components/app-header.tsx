'use client'

import { Camera, Download, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AvatarUploadDialog } from '@/components/avatar-upload-dialog'
import { SearchCommand } from '@/components/search-command'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { signOut, useSession } from '@/lib/auth-client'

export function AppHeader() {
	const router = useRouter()
	const { data: session, isPending } = useSession()
	const user = session?.user
	const [avatarOpen, setAvatarOpen] = useState(false)

	async function handleSignOut() {
		await signOut()
		router.push('/login')
	}

	async function handleExport() {
		try {
			const response = await fetch('/api/export/bookmarks')
			if (!response.ok) throw new Error('Export failed')
			const html = await response.text()
			const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
			const url = URL.createObjectURL(blob)

			const today = new Date()
			const yyyy = today.getFullYear()
			const mm = String(today.getMonth() + 1).padStart(2, '0')
			const dd = String(today.getDate()).padStart(2, '0')

			const a = document.createElement('a')
			a.href = url
			a.download = `open-bookmarks-export-${yyyy}-${mm}-${dd}.html`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

			toast.success('Bookmarks exportés avec succès')
		} catch {
			toast.error("Erreur lors de l'export des bookmarks")
		}
	}

	return (
		<header className="border-b px-3 py-3 h-[60px] sm:px-4">
			<div className="flex items-center justify-between">
				<Link href="/" className="font-semibold text-lg">
					Open Bookmarks
				</Link>
				<div className="flex items-center gap-2">
					{user && <SearchCommand />}
					{isPending ? (
						<Skeleton className="size-9 rounded-full" />
					) : user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full">
									<Avatar className="size-8">
										<AvatarImage
											src={user.image ?? undefined}
											alt={user.name}
										/>
										<AvatarFallback>
											<User className="size-4" />
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>
									<p className="text-sm font-medium">{user.name}</p>
									<p className="text-xs text-muted-foreground">{user.email}</p>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setAvatarOpen(true)}>
									<Camera className="mr-2 size-4" />
									Photo de profil
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleExport}>
									<Download className="mr-2 size-4" />
									Exporter les favoris
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleSignOut}>
									<LogOut className="mr-2 size-4" />
									Deconnexion
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
				</div>
			</div>
			{user && (
				<AvatarUploadDialog
					open={avatarOpen}
					onOpenChange={setAvatarOpen}
					currentImage={user.image}
					userName={user.name}
				/>
			)}
		</header>
	)
}
