import type { ComponentType, SVGProps } from 'react'
import { icons } from 'lucide-react'
import * as PhosphorIcons from '@phosphor-icons/react'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const PHOSPHOR_SKIP = new Set(['IconBase', 'IconContext', 'SSR', 'default'])

function pascalToKebab(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
		.replace(/([a-zA-Z])(\d)/g, '$1-$2')
		.replace(/(\d)([a-zA-Z])/g, '$1-$2')
		.toLowerCase()
}

// ── Lucide icons (~1671) ────────────────────────────────────────────────
const LUCIDE_ICON_MAP: Record<string, IconComponent> = {}
for (const [pascalName, icon] of Object.entries(icons)) {
	LUCIDE_ICON_MAP[pascalToKebab(pascalName)] = icon as IconComponent
}
LUCIDE_ICON_MAP['gamepad'] = LUCIDE_ICON_MAP['gamepad-2']

// ── Phosphor icons (~1512) ──────────────────────────────────────────────
const PHOSPHOR_ICON_MAP: Record<string, IconComponent> = {}
for (const [name, icon] of Object.entries(PhosphorIcons)) {
	if (PHOSPHOR_SKIP.has(name) || name.endsWith('Icon')) continue
	PHOSPHOR_ICON_MAP[pascalToKebab(name)] = icon as IconComponent
}

// ── Combined map (lucide plain, phosphor prefixed) for search ───────────
export const ALL_ICON_MAP: Record<string, IconComponent> = {}
for (const [name, icon] of Object.entries(LUCIDE_ICON_MAP)) {
	ALL_ICON_MAP[name] = icon
}
for (const [name, icon] of Object.entries(PHOSPHOR_ICON_MAP)) {
	ALL_ICON_MAP[`phosphor:${name}`] = icon
}

// ── Resolve any icon name ───────────────────────────────────────────────
export function getFolderIcon(name: string | null | undefined): IconComponent {
	if (!name) return icons.Folder as IconComponent
	if (name.startsWith('phosphor:')) {
		const phosphorName = name.slice(9)
		return PHOSPHOR_ICON_MAP[phosphorName] ?? (icons.Folder as IconComponent)
	}
	return LUCIDE_ICON_MAP[name] ?? (icons.Folder as IconComponent)
}

// ── Merged categories — similar icons from both libs side by side ────────
// Phosphor icons prefixed with 'phosphor:' for DB storage
export const ICON_CATEGORIES: { label: string; icons: string[] }[] = [
	{
		label: 'General',
		icons: [
			'folder', 'phosphor:folder',
			'star', 'phosphor:star',
			'heart', 'phosphor:heart',
			'bookmark', 'phosphor:bookmark-simple',
			'flag', 'phosphor:flag',
			'tag', 'phosphor:tag',
			'target', 'phosphor:target',
			'flame', 'phosphor:fire',
			'zap', 'phosphor:lightning',
			'lightbulb', 'phosphor:lightbulb',
			'sun', 'phosphor:sun',
			'moon', 'phosphor:moon',
			'sparkles', 'phosphor:sparkle',
			'thumbs-up', 'phosphor:thumbs-up',
			'crown', 'phosphor:crown',
			'eye', 'phosphor:eye',
			'bell', 'phosphor:bell',
			'gem', 'phosphor:diamond',
			'award', 'phosphor:trophy',
			'rainbow', 'infinity',
			'circle-dot', 'phosphor:push-pin',
			'phosphor:shooting-star', 'phosphor:medal',
		],
	},
	{
		label: 'Travail',
		icons: [
			'briefcase', 'phosphor:briefcase',
			'building', 'phosphor:building-office',
			'clipboard', 'phosphor:clipboard',
			'chart-bar', 'phosphor:chart-bar',
			'calendar', 'phosphor:calendar',
			'clock', 'phosphor:clock',
			'mail', 'phosphor:envelope',
			'inbox', 'phosphor:tray',
			'list-todo', 'phosphor:list-checks',
			'pen-tool', 'phosphor:pen',
			'chart-line', 'phosphor:chart-line',
			'chart-pie', 'phosphor:chart-pie',
			'presentation', 'phosphor:presentation',
			'kanban', 'phosphor:kanban',
			'notebook', 'phosphor:notebook',
			'timer', 'phosphor:timer',
			'stamp', 'phosphor:stamp',
			'calculator', 'phosphor:calculator',
			'list-checks', 'phosphor:strategy',
			'phosphor:chart-donut',
		],
	},
	{
		label: 'Tech',
		icons: [
			'code', 'phosphor:code',
			'terminal', 'phosphor:terminal',
			'cpu', 'phosphor:cpu',
			'database', 'phosphor:database',
			'server', 'phosphor:hard-drives',
			'cloud', 'phosphor:cloud',
			'globe', 'phosphor:globe',
			'laptop', 'phosphor:laptop',
			'monitor', 'phosphor:monitor',
			'smartphone', 'phosphor:device-mobile',
			'bug', 'phosphor:bug',
			'rocket', 'phosphor:rocket',
			'git-branch', 'phosphor:git-branch',
			'git-merge', 'phosphor:git-merge',
			'wifi', 'phosphor:wifi-high',
			'hard-drive', 'phosphor:hard-drive',
			'circuit-board', 'phosphor:circuitry',
			'binary', 'phosphor:binary',
			'bot', 'phosphor:robot',
			'brain-circuit', 'phosphor:head-circuit',
			'webhook', 'phosphor:webhooks-logo',
			'code-xml', 'phosphor:code-block',
			'blocks', 'container',
			'phosphor:brain', 'phosphor:atom',
		],
	},
	{
		label: 'Media',
		icons: [
			'image', 'phosphor:image',
			'camera', 'phosphor:camera',
			'video', 'phosphor:video-camera',
			'film', 'phosphor:film-strip',
			'music', 'phosphor:music-note',
			'mic', 'phosphor:microphone',
			'tv', 'phosphor:television',
			'newspaper', 'phosphor:newspaper',
			'palette', 'phosphor:palette',
			'brush', 'phosphor:paint-brush',
			'pen', 'phosphor:pen-nib',
			'pencil', 'phosphor:pencil',
			'headphones', 'phosphor:headphones',
			'radio', 'phosphor:radio',
			'aperture', 'phosphor:aperture',
			'clapperboard', 'phosphor:film-slate',
			'drama', 'phosphor:vinyl-record',
			'phosphor:guitar', 'phosphor:piano-keys',
			'phosphor:speaker-high',
		],
	},
	{
		label: 'Education',
		icons: [
			'book', 'phosphor:book',
			'book-open', 'phosphor:book-open',
			'graduation-cap', 'phosphor:graduation-cap',
			'school', 'phosphor:student',
			'brain', 'phosphor:brain',
			'search', 'phosphor:magnifying-glass',
			'file-text', 'phosphor:file-text',
			'library', 'phosphor:books',
			'notebook-pen', 'phosphor:notebook',
			'atom', 'phosphor:atom',
			'microscope', 'phosphor:microscope',
			'telescope', 'phosphor:telescope',
			'flask-conical', 'phosphor:flask',
			'university', 'phosphor:university',
			'test-tube', 'phosphor:test-tube',
			'beaker', 'phosphor:dna',
			'phosphor:exam', 'phosphor:chalkboard',
			'phosphor:lectern',
		],
	},
	{
		label: 'Finance',
		icons: [
			'wallet', 'phosphor:wallet',
			'banknote', 'phosphor:money',
			'credit-card', 'phosphor:credit-card',
			'shopping-cart', 'phosphor:shopping-cart',
			'shopping-bag', 'phosphor:shopping-bag',
			'gift', 'phosphor:gift',
			'package', 'phosphor:package',
			'store', 'phosphor:storefront',
			'receipt', 'phosphor:receipt',
			'coins', 'phosphor:coins',
			'piggy-bank', 'phosphor:piggy-bank',
			'badge-dollar-sign', 'phosphor:currency-dollar',
			'percent', 'phosphor:percent',
			'barcode', 'phosphor:barcode',
			'hand-coins', 'phosphor:hand-coins',
			'shopping-basket', 'phosphor:shopping-bag-open',
			'phosphor:bank', 'phosphor:cash-register',
			'phosphor:invoice',
		],
	},
	{
		label: 'Communication',
		icons: [
			'message-circle', 'phosphor:chat-circle',
			'message-square', 'phosphor:chat',
			'phone', 'phosphor:phone',
			'send', 'phosphor:paper-plane-tilt',
			'at-sign', 'phosphor:at',
			'megaphone', 'phosphor:megaphone',
			'podcast', 'phosphor:podcast',
			'radio-tower', 'phosphor:cell-tower',
			'voicemail', 'phosphor:voicemail',
			'rss', 'phosphor:rss',
			'satellite-dish', 'phosphor:satellite-dish',
			'speech', 'phosphor:envelope',
			'phosphor:chat-dots', 'phosphor:chats',
			'phosphor:broadcast', 'phosphor:translate',
		],
	},
	{
		label: 'Personnes',
		icons: [
			'user', 'phosphor:user',
			'users', 'phosphor:users',
			'baby', 'phosphor:baby',
			'person-standing', 'phosphor:person',
			'circle-user', 'phosphor:user-circle',
			'user-plus', 'phosphor:user-plus',
			'user-round', 'phosphor:user-list',
			'contact', 'phosphor:identification-card',
			'hand', 'phosphor:hand',
			'hand-heart', 'phosphor:hand-heart',
			'heart-handshake', 'phosphor:handshake',
			'accessibility', 'phosphor:person-arms-spread',
			'phosphor:person-simple-walk', 'phosphor:person-simple-run',
			'phosphor:detective',
		],
	},
	{
		label: 'Nature & Animaux',
		icons: [
			'tree-pine', 'phosphor:tree-evergreen',
			'tree-deciduous', 'phosphor:tree',
			'flower', 'phosphor:flower',
			'flower-2', 'phosphor:flower-lotus',
			'leaf', 'phosphor:leaf',
			'mountain', 'phosphor:mountains',
			'bird', 'phosphor:bird',
			'fish', 'phosphor:fish',
			'paw-print', 'phosphor:paw-print',
			'cat', 'phosphor:cat',
			'dog', 'phosphor:dog',
			'rabbit', 'phosphor:rabbit',
			'sprout', 'phosphor:plant',
			'trees', 'phosphor:potted-plant',
			'snail', 'phosphor:butterfly',
			'turtle', 'phosphor:horse',
			'clover', 'phosphor:flower-tulip',
			'squirrel', 'phosphor:acorn',
			'shrub', 'phosphor:cactus',
			'wheat', 'phosphor:tree-palm',
		],
	},
	{
		label: 'Transport',
		icons: [
			'car', 'phosphor:car',
			'plane', 'phosphor:airplane',
			'bus', 'phosphor:bus',
			'bike', 'phosphor:bicycle',
			'truck', 'phosphor:truck',
			'train-front', 'phosphor:train',
			'ship', 'phosphor:boat',
			'fuel', 'phosphor:gas-pump',
			'map-pin', 'phosphor:map-pin',
			'navigation', 'phosphor:navigation-arrow',
			'compass', 'phosphor:compass',
			'sailboat', 'phosphor:sailboat',
			'motorbike', 'phosphor:motorcycle',
			'helicopter', 'phosphor:helicopter',
			'ambulance', 'phosphor:ambulance',
			'cable-car', 'phosphor:cable-car',
			'scooter', 'phosphor:scooter',
			'phosphor:taxi', 'phosphor:jeep',
			'phosphor:tram',
		],
	},
	{
		label: 'Nourriture',
		icons: [
			'apple', 'phosphor:orange-slice',
			'pizza', 'phosphor:pizza',
			'cake', 'phosphor:cake',
			'cherry', 'phosphor:cherries',
			'croissant', 'phosphor:croissant',
			'egg', 'phosphor:egg',
			'grape', 'phosphor:orange',
			'banana', 'phosphor:avocado',
			'carrot', 'phosphor:carrot',
			'popcorn', 'phosphor:popcorn',
			'sandwich', 'phosphor:hamburger',
			'cookie', 'phosphor:cookie',
			'ice-cream-cone', 'phosphor:ice-cream',
			'wine', 'phosphor:wine',
			'beer', 'phosphor:beer-stein',
			'milk', 'phosphor:coffee',
			'soup', 'phosphor:bowl-food',
			'ham', 'phosphor:shrimp',
			'beef', 'phosphor:bowl-steam',
			'salad', 'phosphor:bread',
			'cake-slice', 'dessert',
		],
	},
	{
		label: 'Sport & Loisirs',
		icons: [
			'gamepad-2', 'phosphor:game-controller',
			'trophy', 'phosphor:trophy',
			'dumbbell', 'phosphor:barbell',
			'medal', 'phosphor:medal',
			'swords', 'phosphor:sword',
			'dice-5', 'phosphor:dice-five',
			'puzzle', 'phosphor:puzzle-piece',
			'tent', 'phosphor:tent',
			'volleyball', 'phosphor:volleyball',
			'joystick', 'phosphor:joystick',
			'biceps-flexed', 'phosphor:basketball',
			'kayak', 'phosphor:soccer-ball',
			'guitar', 'phosphor:tennis-ball',
			'drum', 'phosphor:baseball',
			'roller-coaster', 'phosphor:football',
			'ferris-wheel', 'phosphor:ping-pong',
			'party-popper', 'phosphor:confetti',
			'phosphor:racquet', 'phosphor:swimming-pool',
		],
	},
	{
		label: 'Sante',
		icons: [
			'heart-pulse', 'phosphor:heartbeat',
			'stethoscope', 'phosphor:stethoscope',
			'pill', 'phosphor:pill',
			'syringe', 'phosphor:syringe',
			'thermometer', 'phosphor:thermometer',
			'activity', 'phosphor:first-aid-kit',
			'bandage', 'phosphor:bandaids',
			'hospital', 'phosphor:hospital',
			'cross', 'phosphor:dna',
			'pill-bottle', 'phosphor:tooth',
			'ear', 'phosphor:ear',
			'scan-heart', 'phosphor:wheelchair',
			'phosphor:face-mask', 'phosphor:prescription',
		],
	},
	{
		label: 'Vie quotidienne',
		icons: [
			'home', 'phosphor:house',
			'coffee', 'phosphor:coffee',
			'utensils', 'phosphor:fork-knife',
			'umbrella', 'phosphor:umbrella',
			'map', 'phosphor:map-trifold',
			'bed', 'phosphor:bed',
			'lamp-desk', 'phosphor:lamp',
			'sofa', 'phosphor:couch',
			'cooking-pot', 'phosphor:cooking-pot',
			'shirt', 'phosphor:t-shirt',
			'scissors', 'phosphor:scissors',
			'door-open', 'phosphor:door-open',
			'armchair', 'phosphor:armchair',
			'key', 'phosphor:key',
			'washing-machine', 'phosphor:washing-machine',
			'bath', 'phosphor:bathtub',
			'shower-head', 'phosphor:shower',
			'refrigerator', 'phosphor:broom',
			'phosphor:toilet',
		],
	},
	{
		label: 'Fichiers',
		icons: [
			'file', 'phosphor:file',
			'file-text', 'phosphor:file-text',
			'file-code', 'phosphor:file-code',
			'file-image', 'phosphor:file-image',
			'folder-open', 'phosphor:folder-open',
			'paperclip', 'phosphor:paperclip',
			'save', 'phosphor:floppy-disk',
			'clipboard-list', 'phosphor:clipboard-text',
			'scroll', 'phosphor:scroll',
			'files', 'phosphor:files',
			'folder-tree', 'phosphor:folders',
			'file-music', 'phosphor:file-audio',
			'file-spreadsheet', 'phosphor:file-video',
			'file-archive', 'phosphor:file-pdf',
			'notebook-tabs', 'phosphor:file-zip',
			'phosphor:tree-structure', 'phosphor:note',
		],
	},
	{
		label: 'Systeme',
		icons: [
			'settings', 'phosphor:gear',
			'wrench', 'phosphor:wrench',
			'lock', 'phosphor:lock',
			'shield', 'phosphor:shield',
			'download', 'phosphor:download',
			'upload', 'phosphor:upload',
			'archive', 'phosphor:archive',
			'box', 'phosphor:cube',
			'layers', 'phosphor:stack',
			'link', 'phosphor:link',
			'fingerprint-pattern', 'phosphor:fingerprint',
			'scan', 'phosphor:scan',
			'shield-check', 'phosphor:shield-check',
			'cctv', 'phosphor:security-camera',
			'eye-off', 'phosphor:eye-slash',
			'lock-keyhole', 'phosphor:lock-key',
			'scan-face', 'phosphor:plugs-connected',
			'phosphor:terminal-window',
		],
	},
]
