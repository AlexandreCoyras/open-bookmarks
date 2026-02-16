'use client'

import { useTranslations } from 'next-intl'
import { type ChangeEvent, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

const MAX_FILE_SIZE = 10 * 1024 * 1024

type ImportDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onImport: (html: string) => void
	loading?: boolean
}

export function ImportDialog({
	open,
	onOpenChange,
	onImport,
	loading,
}: ImportDialogProps) {
	const [file, setFile] = useState<File | null>(null)
	const [error, setError] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const t = useTranslations('Import')

	function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
		setError(null)
		const selected = e.target.files?.[0]
		if (!selected) {
			setFile(null)
			return
		}
		if (selected.size > MAX_FILE_SIZE) {
			setError(t('fileTooLarge'))
			setFile(null)
			return
		}
		setFile(selected)
	}

	function handleImport() {
		if (!file) return
		const reader = new FileReader()
		reader.onload = () => {
			onImport(reader.result as string)
		}
		reader.readAsText(file)
	}

	function handleOpenChange(value: boolean) {
		if (!value) {
			setFile(null)
			setError(null)
			if (inputRef.current) inputRef.current.value = ''
		}
		onOpenChange(value)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('title')}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4">
					<p className="text-muted-foreground text-sm">{t('description')}</p>
					<input
						ref={inputRef}
						type="file"
						accept=".html,.htm"
						onChange={handleFileChange}
						className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-medium file:text-primary-foreground file:text-sm hover:file:bg-primary/90"
					/>
					{error && <p className="text-destructive text-sm">{error}</p>}
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
						>
							{t('cancel')}
						</Button>
						<Button onClick={handleImport} disabled={!file || loading}>
							{loading ? t('importing') : t('importButton')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
