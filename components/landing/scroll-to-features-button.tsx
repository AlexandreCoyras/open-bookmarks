'use client'

import { Button } from '@/components/ui/button'

export function ScrollToFeaturesButton({ label }: { label: string }) {
	return (
		<Button
			variant="outline"
			size="lg"
			onClick={() =>
				document
					.getElementById('features')
					?.scrollIntoView({ behavior: 'smooth' })
			}
		>
			{label}
		</Button>
	)
}
