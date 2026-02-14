import Link from 'next/link'

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-svh">
			<header className="border-b px-4 py-3 h-[60px]">
				<div className="flex items-center">
					<Link href="/" className="font-semibold text-lg">
						Open Bookmarks
					</Link>
				</div>
			</header>
			<main className="p-4">{children}</main>
		</div>
	)
}
