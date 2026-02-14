'use client'

import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

	async function handleSignOut() {
		await signOut()
		router.push('/login')
	}

	return (
		<header className="border-b px-4 py-3 h-[60px]">
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-lg">Open Bookmarks</h1>
				{isPending ? (
					<Skeleton className="size-9 rounded-full" />
				) : user ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="rounded-full">
								<Avatar className="size-8">
									<AvatarImage src={user.image ?? undefined} alt={user.name} />
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
							<DropdownMenuItem onClick={handleSignOut}>
								<LogOut className="mr-2 size-4" />
								Deconnexion
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
		</header>
	)
}
