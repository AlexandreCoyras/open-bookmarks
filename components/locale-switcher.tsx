'use client'

import { Globe } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from '@/lib/navigation'

const languages = [
	{ locale: 'en', label: 'English' },
	{ locale: 'fr', label: 'Francais' },
] as const

export function LocaleSwitcher() {
	const locale = useLocale()
	const router = useRouter()
	const pathname = usePathname()

	function handleSwitch(newLocale: string) {
		router.replace(pathname, { locale: newLocale })
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="size-8">
					<Globe className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{languages.map((lang) => (
					<DropdownMenuItem
						key={lang.locale}
						onClick={() => handleSwitch(lang.locale)}
						className={locale === lang.locale ? 'font-medium' : ''}
					>
						{lang.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
