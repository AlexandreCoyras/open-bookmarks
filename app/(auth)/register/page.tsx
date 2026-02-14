import Link from 'next/link'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default function RegisterPage() {
	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Créer un compte</CardTitle>
				<CardDescription>
					Inscrivez-vous pour commencer à sauvegarder vos favoris
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">
					Formulaire d'inscription à venir.
				</p>
				<p className="mt-4 text-center text-sm">
					Déjà un compte ?{' '}
					<Link href="/login" className="underline">
						Se connecter
					</Link>
				</p>
			</CardContent>
		</Card>
	)
}
