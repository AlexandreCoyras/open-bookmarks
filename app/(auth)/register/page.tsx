'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, signUp } from '@/lib/auth-client'

export default function RegisterPage() {
	const router = useRouter()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()
		setError('')
		setLoading(true)

		const { error } = await signUp.email({ name, email, password })

		if (error) {
			setError(error.message ?? 'Une erreur est survenue')
			setLoading(false)
			return
		}

		router.push('/')
	}

	async function handleGitHub() {
		await signIn.social({ provider: 'github', callbackURL: '/' })
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Creer un compte</CardTitle>
				<CardDescription>
					Inscrivez-vous pour commencer a sauvegarder vos favoris
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Nom</Label>
						<Input
							id="name"
							type="text"
							placeholder="Votre nom"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="vous@exemple.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Mot de passe</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
						/>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" disabled={loading}>
						{loading ? 'Inscription...' : "S'inscrire"}
					</Button>
				</form>
				<div className="relative my-4">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-card px-2 text-muted-foreground">ou</span>
					</div>
				</div>
				<Button variant="outline" className="w-full" onClick={handleGitHub}>
					Se connecter avec GitHub
				</Button>
				<p className="mt-4 text-center text-sm">
					Deja un compte ?{' '}
					<Link href="/login" className="underline">
						Se connecter
					</Link>
				</p>
			</CardContent>
		</Card>
	)
}
