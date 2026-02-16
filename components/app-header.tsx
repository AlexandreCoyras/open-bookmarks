'use client'

import { Camera, Download, Globe, LogOut, User } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
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
import { Link, usePathname, useRouter } from '@/lib/navigation'

export function AppHeader() {
	const router = useRouter()
	const pathname = usePathname()
	const locale = useLocale()
	const { data: session, isPending } = useSession()
	const user = session?.user
	const [avatarOpen, setAvatarOpen] = useState(false)
	const t = useTranslations('Header')

	const otherLocale = locale === 'en' ? 'fr' : 'en'
	const otherLabel = locale === 'en' ? 'Francais' : 'English'

	function handleSwitchLocale() {
		router.replace(pathname, { locale: otherLocale })
	}

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

			toast.success(t('exportSuccess'))
		} catch {
			toast.error(t('exportError'))
		}
	}

	return (
		<header className="border-b px-3 py-3 h-[60px] sm:px-4">
			<div className="flex items-center justify-between">
				<Link href="/dashboard" className="font-semibold text-lg">
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
									{t('profilePicture')}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleExport}>
									<Download className="mr-2 size-4" />
									{t('exportBookmarks')}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleSwitchLocale}>
									<Globe className="mr-2 size-4" />
									{otherLabel}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									<LogOut className="mr-2 size-4" />
									{t('signOut')}
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
