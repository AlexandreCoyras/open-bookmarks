import { AppHeader } from '@/components/app-header'
import { OfflineBanner } from '@/components/offline-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-svh">
			<AppHeader />
			<OfflineBanner />
			<main className="p-4">{children}</main>
		</div>
	)
}
