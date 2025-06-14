import type { Context as HonoContext } from "hono";
import { createDatabase } from "../db";
import { auth } from "./auth";
import type { HonoEnv } from "./env";
import { envSchema, env as processEnv } from "./env";

export type CreateContextOptions = {
	context: HonoContext<HonoEnv>;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	// En développement local, utilise process.env
	// En production Cloudflare, utilise context.env (variables d'environnement Cloudflare)
	let env = processEnv;
	let db = null;

	// Si on est dans un environnement Cloudflare Workers
	if (context.env) {
		// Valider les variables d'environnement Cloudflare
		env = envSchema.parse(context.env);

		// Utiliser D1 si disponible
		if (context.env.DB) {
			db = createDatabase(context.env.DB);
		}
	}

	return {
		session,
		env,
		db, // Base de données D1 en production, null en dev
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
