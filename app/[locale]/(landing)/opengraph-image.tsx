import { ImageResponse } from 'next/og'

export const alt = 'Open Bookmarks'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#09090b',
				color: '#fafafa',
				padding: 60,
			}}
		>
			<div
				style={{
					fontSize: 64,
					fontWeight: 700,
					marginBottom: 24,
				}}
			>
				Open Bookmarks
			</div>
			<div
				style={{
					fontSize: 28,
					color: '#a1a1aa',
					textAlign: 'center',
				}}
			>
				Save, organize and sync your bookmarks across all your devices.
			</div>
		</div>,
		size,
	)
}
