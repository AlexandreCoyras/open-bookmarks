export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-svh">
			<header className="border-b px-4 py-3">
				<h1 className="font-semibold text-lg">Open Bookmarks</h1>
			</header>
			<main className="p-4">{children}</main>
		</div>
	)
}
