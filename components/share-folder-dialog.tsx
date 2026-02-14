'use client'

import { Check, Copy, Eye, Globe, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useCheckSlug, useUpdateFolder } from '@/lib/hooks/use-folders'
import { cn } from '@/lib/utils'

function generateSlug() {
	return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

function validateSlug(slug: string): string | null {
	if (slug.length < 3) return 'Minimum 3 caractères'
	if (slug.length > 50) return 'Maximum 50 caractères'
	if (!/^[a-z0-9-]+$/.test(slug))
		return 'Lettres minuscules, chiffres et tirets uniquement'
	if (!slugRegex.test(slug))
		return 'Ne peut pas commencer ou finir par un tiret'
	return null
}

export function ShareFolderDialog({
	folderId,
	publicSlug,
	viewCount,
}: {
	folderId: string
	publicSlug: string | null | undefined
	viewCount?: number
}) {
	const updateFolder = useUpdateFolder()
	const [copied, setCopied] = useState(false)
	const isPublic = !!publicSlug

	const [slugInput, setSlugInput] = useState(publicSlug ?? '')
	const [debouncedSlug, setDebouncedSlug] = useState(slugInput)

	useEffect(() => {
		setSlugInput(publicSlug ?? '')
		setDebouncedSlug(publicSlug ?? '')
	}, [publicSlug])

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSlug(slugInput), 500)
		return () => clearTimeout(timer)
	}, [slugInput])

	const validationError = slugInput ? validateSlug(slugInput) : null
	const isChanged = slugInput !== (publicSlug ?? '')
	const shouldCheck = isChanged && !validationError && debouncedSlug.length >= 3
	const { data: slugCheck, isLoading: checkingSlug } = useCheckSlug(
		shouldCheck ? debouncedSlug : '',
		folderId,
	)

	const isSlugAvailable = shouldCheck ? slugCheck?.available : true
	const canSave =
		isChanged && !validationError && isSlugAvailable && !checkingSlug

	const origin = typeof window !== 'undefined' ? window.location.origin : ''
	const publicUrl = publicSlug ? `${origin}/s/${publicSlug}` : ''
	const previewUrl = slugInput ? `${origin}/s/${slugInput}` : ''

	async function handleToggle(checked: boolean) {
		const newSlug = checked ? generateSlug() : null
		await updateFolder.mutateAsync({
			id: folderId,
			publicSlug: newSlug,
		})
		toast.success(checked ? 'Dossier rendu public' : 'Partage désactivé')
	}

	async function handleSaveSlug() {
		if (!canSave) return
		try {
			await updateFolder.mutateAsync({
				id: folderId,
				publicSlug: slugInput,
			})
			toast.success('Lien mis à jour')
		} catch {
			toast.error('Ce lien est déjà utilisé')
		}
	}

	function handleRegenerate() {
		setSlugInput(generateSlug())
	}

	async function handleCopy() {
		await navigator.clipboard.writeText(isChanged ? previewUrl : publicUrl)
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

				{/* Toggle */}
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
					<>
						<Separator />

						{/* URL preview + copy */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">
								Lien de partage
							</Label>
							<div className="flex items-center gap-2">
								<div className="flex min-w-0 flex-1 items-center rounded-md border bg-muted/50 px-3 py-2">
									<span className="truncate text-sm text-muted-foreground">
										{origin}/s/
										<span className="text-foreground font-medium">
											{slugInput || '...'}
										</span>
									</span>
								</div>
								<Button
									size="icon"
									variant="outline"
									onClick={handleCopy}
									className="shrink-0"
								>
									{copied ? (
										<Check className="size-4" />
									) : (
										<Copy className="size-4" />
									)}
								</Button>
							</div>
						</div>

						{/* Slug editor */}
						<div className="space-y-1.5">
							<Label
								htmlFor="slug-input"
								className="text-xs text-muted-foreground"
							>
								Personnaliser le lien
							</Label>
							<div className="flex items-center gap-1.5">
								<div className="flex min-w-0 flex-1 items-center rounded-md border bg-muted/50 focus-within:ring-ring/50 focus-within:border-ring focus-within:ring-[3px] transition-[box-shadow,border-color]">
									<span className="pl-3 text-sm text-muted-foreground select-none">
										/s/
									</span>
									<Input
										id="slug-input"
										value={slugInput}
										onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
										className="border-0 bg-transparent shadow-none pl-0 focus-visible:ring-0 focus-visible:border-transparent"
										placeholder="mon-dossier"
									/>
								</div>
								<Button
									size="icon"
									variant="ghost"
									onClick={handleRegenerate}
									title="Régénérer"
									className="shrink-0"
								>
									<RefreshCw className="size-4" />
								</Button>
							</div>
							{/* Validation feedback -- fixed height to prevent layout shift */}
							<p
								className={cn(
									'text-xs h-4',
									validationError
										? 'text-destructive'
										: !shouldCheck
											? 'text-transparent'
											: checkingSlug
												? 'text-muted-foreground'
												: isSlugAvailable
													? 'text-green-600'
													: 'text-destructive',
								)}
							>
								{validationError
									? validationError
									: !shouldCheck
										? '\u00A0'
										: checkingSlug
											? 'Vérification...'
											: isSlugAvailable
												? 'Disponible'
												: 'Ce lien est déjà utilisé'}
							</p>
						</div>

						{/* Save button -- always present, disabled when no changes */}
						<Button
							onClick={handleSaveSlug}
							disabled={!canSave || updateFolder.isPending}
							className="w-full"
						>
							Enregistrer le lien
						</Button>

						{/* View count */}
						{viewCount !== undefined && (
							<>
								<Separator />
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Eye className="size-3.5" />
									<span>
										{viewCount} vue{viewCount !== 1 ? 's' : ''}
									</span>
								</div>
							</>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
