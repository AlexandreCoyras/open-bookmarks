const PREFIX = '[OB Sync]'

export const logger = {
	info: (...args: unknown[]) => console.log(PREFIX, ...args),
	warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
	error: (...args: unknown[]) => console.error(PREFIX, ...args),
	debug: (...args: unknown[]) => {
		if (process.env.NODE_ENV !== 'production') {
			console.debug(PREFIX, ...args)
		}
	},
}
