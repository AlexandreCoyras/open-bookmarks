'use client'

import dynamic from 'next/dynamic'

const BookmarkScene = dynamic(
	() => import('@/components/landing/bookmark-scene'),
	{
		ssr: false,
		loading: () => <div className="min-h-[400px]" />,
	},
)

export function BookmarkSceneWrapper() {
	return <BookmarkScene />
}
