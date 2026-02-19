/**
 * Chainable mock for the Drizzle ORM `db` object.
 *
 * Each operation type (select, insert, update, delete, execute) has its own
 * results queue. Push expected results before calling `app.handle()`.
 * The chain is thenable — awaiting it pops the next result from the queue.
 */

// biome-ignore lint/suspicious/noExplicitAny: test mock requires dynamic types
type ResultQueue = any[][]
// biome-ignore lint/suspicious/noExplicitAny: test mock requires dynamic types
type ExecuteQueue = { rows: any[] }[]

export const dbResults = {
	select: [] as ResultQueue,
	insert: [] as ResultQueue,
	update: [] as ResultQueue,
	delete: [] as ResultQueue,
	execute: [] as ExecuteQueue,
}

export function resetDbMocks() {
	dbResults.select.length = 0
	dbResults.insert.length = 0
	dbResults.update.length = 0
	dbResults.delete.length = 0
	dbResults.execute.length = 0
}

// biome-ignore lint/suspicious/noExplicitAny: test mock requires dynamic types
function makeChain(queue: () => any) {
	// biome-ignore lint/suspicious/noExplicitAny: test mock requires dynamic types
	const chain: Record<string, any> = {}
	const passthrough = [
		'from',
		'where',
		'orderBy',
		'limit',
		'offset',
		'groupBy',
		'having',
		'set',
		'values',
		'returning',
		'onConflictDoNothing',
		'onConflictDoUpdate',
		'innerJoin',
		'leftJoin',
		'rightJoin',
		'fullJoin',
	]

	for (const method of passthrough) {
		chain[method] = () => chain
	}

	// biome-ignore lint/suspicious/noThenProperty: thenable interface is required for await
	// biome-ignore lint/suspicious/noExplicitAny: thenable interface requires any
	chain.then = (resolve: (v: any) => any, reject?: (e: any) => any) => {
		try {
			resolve(queue())
		} catch (e) {
			if (reject) reject(e)
		}
	}

	return chain
}

// biome-ignore lint/suspicious/noExplicitAny: mock needs to accept any arguments
type Args = any[]

export const mockDb = {
	select: (..._args: Args) => makeChain(() => dbResults.select.shift() ?? []),
	insert: (..._args: Args) => makeChain(() => dbResults.insert.shift() ?? []),
	update: (..._args: Args) => makeChain(() => dbResults.update.shift() ?? []),
	delete: (..._args: Args) => makeChain(() => dbResults.delete.shift() ?? []),
	execute: (..._args: Args) =>
		Promise.resolve(dbResults.execute.shift() ?? { rows: [] }),
	query: new Proxy(
		{},
		{
			get: () =>
				new Proxy(
					{},
					{
						get: () => () => Promise.resolve([]),
					},
				),
		},
	),
}
