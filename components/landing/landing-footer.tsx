export function LandingFooter() {
	return (
		<footer className="border-t py-8">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
				<div className="flex items-center gap-2">
					<span className="font-serif font-semibold">Open Bookmarks</span>
					<span className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()}</span>
				</div>

				<div className="flex items-center gap-4">
					<a
						href="https://github.com/AlexandreCoyras/open-bookmarks"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						GitHub
					</a>
					<span className="text-sm text-muted-foreground">
						Made by{' '}
						<a
							href="https://github.com/AlexandreCoyras"
							target="_blank"
							rel="noopener noreferrer"
							className="transition-colors hover:text-foreground"
						>
							AlexandreCoyras
						</a>
					</span>
				</div>
			</div>
		</footer>
	)
}
