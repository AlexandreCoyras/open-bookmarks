import { AppHeader } from '@/components/app-header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-svh">
			<AppHeader />
			<main className="p-4">{children}</main>
		</div>
	)
}
