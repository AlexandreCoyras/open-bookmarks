import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getErrorStatus(error: unknown): number | undefined {
	if (error && typeof error === 'object' && 'status' in error) {
		return (error as { status: number }).status
	}
	return undefined
}
