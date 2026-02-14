import Link from 'next/link'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Connexion</CardTitle>
				<CardDescription>
					Connectez-vous à votre compte Open Bookmarks
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">
					Formulaire de connexion à venir.
				</p>
				<p className="mt-4 text-center text-sm">
					Pas encore de compte ?{' '}
					<Link href="/register" className="underline">
						Créer un compte
					</Link>
				</p>
			</CardContent>
		</Card>
	)
}
