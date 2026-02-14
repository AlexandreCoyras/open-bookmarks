'use client'

import { Check, Copy, Globe } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { useUpdateFolder } from '@/lib/hooks/use-folders'

function generateSlug() {
	return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

export function ShareFolderDialog({
	folderId,
	publicSlug,
}: {
	folderId: string
	publicSlug: string | null | undefined
}) {
	const updateFolder = useUpdateFolder()
	const [copied, setCopied] = useState(false)
	const isPublic = !!publicSlug

	const publicUrl =
		typeof window !== 'undefined' && publicSlug
			? `${window.location.origin}/s/${publicSlug}`
			: ''

	async function handleToggle(checked: boolean) {
		await updateFolder.mutateAsync({
			id: folderId,
			publicSlug: checked ? generateSlug() : null,
		})
		toast.success(checked ? 'Dossier rendu public' : 'Partage desactive')
	}

	async function handleCopy() {
		await navigator.clipboard.writeText(publicUrl)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="icon-sm"
					variant="ghost"
					className={
						isPublic
							? 'bg-blue-400/20 text-primary hover:bg-blue-400/15'
							: undefined
					}
				>
					<Globe className="size-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Partager le dossier</DialogTitle>
					<DialogDescription>
						Rendez ce dossier accessible via un lien public en lecture seule.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="public-toggle">Dossier public</Label>
						<Switch
							id="public-toggle"
							checked={isPublic}
							onCheckedChange={handleToggle}
							disabled={updateFolder.isPending}
						/>
					</div>
					{isPublic && (
						<div className="flex items-center gap-2">
							<Input value={publicUrl} readOnly className="text-sm" />
							<Button size="icon" variant="outline" onClick={handleCopy}>
								{copied ? (
									<Check className="size-4" />
								) : (
									<Copy className="size-4" />
								)}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
