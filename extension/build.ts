import { cp, rm } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = import.meta.dir
const DIST = join(ROOT, 'dist')

// Clean dist
await rm(DIST, { recursive: true, force: true })

// Bundle TypeScript entrypoints
await Bun.build({
	entrypoints: [
		join(ROOT, 'src/background/service-worker.ts'),
		join(ROOT, 'src/popup/popup.ts'),
	],
	outdir: DIST,
	target: 'browser',
	format: 'esm',
	minify: process.env.NODE_ENV === 'production',
	sourcemap: 'external',
	naming: {
		entry: '[dir]/[name].[ext]',
	},
})

// Copy static files
await cp(join(ROOT, 'manifest.json'), join(DIST, 'manifest.json'))
await cp(join(ROOT, 'src/popup/popup.html'), join(DIST, 'popup/popup.html'))
await cp(join(ROOT, 'src/popup/popup.css'), join(DIST, 'popup/popup.css'))
await cp(join(ROOT, 'icons'), join(DIST, 'icons'), { recursive: true })

console.log('Extension built successfully → extension/dist/')
