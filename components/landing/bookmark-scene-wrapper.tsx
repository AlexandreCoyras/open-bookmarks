'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const BookmarkScene = dynamic(
	() => import('@/components/landing/bookmark-scene'),
	{
		ssr: false,
		loading: () => <div className="min-h-[400px]" />,
	},
)

export function BookmarkSceneWrapper() {
	const [ready, setReady] = useState(false)

	useEffect(() => {
		if ('requestIdleCallback' in window) {
			const id = requestIdleCallback(() => setReady(true))
			return () => cancelIdleCallback(id)
		}
		const timeout = setTimeout(() => setReady(true), 200)
		return () => clearTimeout(timeout)
	}, [])

	if (!ready) return <div className="min-h-[400px]" />

	return <BookmarkScene />
}
