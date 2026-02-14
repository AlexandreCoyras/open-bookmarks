import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
			<WifiOff className="text-muted-foreground size-16" />
			<h1 className="text-2xl font-bold">Vous êtes hors ligne</h1>
			<p className="text-muted-foreground max-w-sm">
				Ouvrez l'application une première fois avec une connexion internet pour
				pouvoir l'utiliser hors ligne ensuite.
			</p>
		</div>
	)
}
