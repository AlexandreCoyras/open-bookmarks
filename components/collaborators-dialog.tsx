'use client'

import { Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
	useCollaborators,
	useInviteCollaborator,
	useRemoveCollaborator,
	useUpdateCollaboratorRole,
} from '@/lib/hooks/use-collaborators'

export function CollaboratorsDialog({ folderId }: { folderId: string }) {
	const { data: collaborators } = useCollaborators(folderId)
	const invite = useInviteCollaborator()
	const updateRole = useUpdateCollaboratorRole()
	const remove = useRemoveCollaborator()

	const [email, setEmail] = useState('')
	const [role, setRole] = useState<'viewer' | 'editor'>('viewer')

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault()
		if (!email.trim()) return

		try {
			await invite.mutateAsync({ folderId, email: email.trim(), role })
			setEmail('')
			toast.success('Collaborateur invite')
		} catch (err: unknown) {
			const status = (err as { status?: number })?.status
			if (status === 404) {
				toast.error('Utilisateur introuvable')
			} else if (status === 400) {
				toast.error('Vous ne pouvez pas vous inviter vous-meme')
			} else if (status === 409) {
				toast.error('Cet utilisateur est deja invite')
			} else {
				toast.error("Erreur lors de l'invitation")
			}
		}
	}

	async function handleRoleChange(
		collabId: string,
		newRole: 'viewer' | 'editor',
	) {
		try {
			await updateRole.mutateAsync({ id: collabId, role: newRole })
			toast.success('Role mis a jour')
		} catch {
			toast.error('Erreur lors de la mise a jour')
		}
	}

	async function handleRemove(collabId: string) {
		try {
			await remove.mutateAsync(collabId)
			toast.success('Collaborateur retire')
		} catch {
			toast.error('Erreur lors de la suppression')
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="icon-sm"
					variant="ghost"
					className={
						collaborators && collaborators.length > 0
							? 'bg-violet-400/20 text-primary hover:bg-violet-400/15'
							: undefined
					}
				>
					<Users className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Collaborateurs</DialogTitle>
					<DialogDescription>
						Invitez des utilisateurs a collaborer sur ce dossier.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleInvite} className="flex gap-2">
					<div className="flex-1">
						<Label htmlFor="collab-email" className="sr-only">
							Email
						</Label>
						<Input
							id="collab-email"
							type="email"
							placeholder="email@exemple.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<Select
						value={role}
						onValueChange={(v) => setRole(v as 'viewer' | 'editor')}
					>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="viewer">Lecteur</SelectItem>
							<SelectItem value="editor">Editeur</SelectItem>
						</SelectContent>
					</Select>
					<Button type="submit" disabled={invite.isPending || !email.trim()}>
						Inviter
					</Button>
				</form>

				{collaborators && collaborators.length > 0 && (
					<>
						<Separator />
						<div className="space-y-3 max-h-64 overflow-y-auto">
							{collaborators.map((collab) => (
								<div key={collab.id} className="flex items-center gap-3">
									<Avatar className="size-8">
										<AvatarImage src={collab.user.image ?? undefined} />
										<AvatarFallback>
											{collab.user.name?.[0]?.toUpperCase() ?? '?'}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{collab.user.name}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{collab.user.email}
										</p>
									</div>
									<Select
										value={collab.role}
										onValueChange={(v) =>
											handleRoleChange(collab.id, v as 'viewer' | 'editor')
										}
									>
										<SelectTrigger className="w-24 h-8 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="viewer">Lecteur</SelectItem>
											<SelectItem value="editor">Editeur</SelectItem>
										</SelectContent>
									</Select>
									<Button
										size="icon-xs"
										variant="ghost"
										onClick={() => handleRemove(collab.id)}
										className="text-destructive"
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							))}
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
