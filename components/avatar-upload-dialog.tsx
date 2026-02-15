'use client'

import { Camera, Loader2, Trash2, Upload, User } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteAvatar, useUploadAvatar } from '@/lib/hooks/use-avatar'

export function AvatarUploadDialog({
	open,
	onOpenChange,
	currentImage,
	userName,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	currentImage: string | null | undefined
	userName: string
}) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [preview, setPreview] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const uploadAvatar = useUploadAvatar()
	const deleteAvatar = useDeleteAvatar()

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		if (file.size > 2 * 1024 * 1024) {
			toast.error('Le fichier est trop volumineux. Taille maximale : 2 Mo.')
			return
		}

		setSelectedFile(file)
		const url = URL.createObjectURL(file)
		setPreview(url)
	}

	async function handleUpload() {
		if (!selectedFile) return

		try {
			await uploadAvatar.mutateAsync(selectedFile)
			toast.success('Photo de profil mise à jour')
			resetAndClose()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Erreur lors de l'upload",
			)
		}
	}

	async function handleDelete() {
		try {
			await deleteAvatar.mutateAsync()
			toast.success('Photo de profil supprimée')
			resetAndClose()
		} catch {
			toast.error('Erreur lors de la suppression')
		}
	}

	function resetAndClose() {
		setSelectedFile(null)
		if (preview) URL.revokeObjectURL(preview)
		setPreview(null)
		onOpenChange(false)
	}

	const isLoading = uploadAvatar.isPending || deleteAvatar.isPending
	const displayImage = preview ?? currentImage ?? undefined

	return (
		<Dialog
			open={open}
			onOpenChange={(v) =>
				!isLoading && (v ? onOpenChange(v) : resetAndClose())
			}
		>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Photo de profil</DialogTitle>
					<DialogDescription>
						Choisissez une image (JPEG, PNG, WebP ou GIF, max 2 Mo).
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-4">
					<Avatar className="size-24">
						<AvatarImage src={displayImage} alt={userName} />
						<AvatarFallback className="text-2xl">
							<User className="size-10" />
						</AvatarFallback>
					</Avatar>

					<input
						ref={inputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						onChange={handleFileChange}
						className="hidden"
					/>

					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => inputRef.current?.click()}
							disabled={isLoading}
						>
							<Camera className="mr-2 size-4" />
							Choisir une image
						</Button>

						{currentImage && !selectedFile && (
							<Button
								variant="outline"
								onClick={handleDelete}
								disabled={isLoading}
							>
								{deleteAvatar.isPending ? (
									<Loader2 className="mr-2 size-4 animate-spin" />
								) : (
									<Trash2 className="mr-2 size-4" />
								)}
								Supprimer
							</Button>
						)}
					</div>

					{selectedFile && (
						<Button
							onClick={handleUpload}
							disabled={isLoading}
							className="w-full"
						>
							{uploadAvatar.isPending ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : (
								<Upload className="mr-2 size-4" />
							)}
							Enregistrer
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
