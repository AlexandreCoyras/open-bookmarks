'use client'

import { Camera, Loader2, Trash2, Upload, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
	const t = useTranslations('Avatar')

	const uploadAvatar = useUploadAvatar()
	const deleteAvatar = useDeleteAvatar()

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		if (file.size > 2 * 1024 * 1024) {
			toast.error(t('fileTooLarge'))
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
			toast.success(t('updated'))
			resetAndClose()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t('uploadError'))
		}
	}

	async function handleDelete() {
		try {
			await deleteAvatar.mutateAsync()
			toast.success(t('deleted'))
			resetAndClose()
		} catch {
			toast.error(t('deleteError'))
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
					<DialogTitle>{t('title')}</DialogTitle>
					<DialogDescription>{t('description')}</DialogDescription>
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
							{t('chooseImage')}
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
								{t('delete')}
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
							{t('save')}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
