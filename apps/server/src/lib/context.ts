import type { Context as HonoContext } from "hono";
import { createDatabase } from "../db";
import { createAuth } from "./auth";
import type { HonoEnv } from "./env";
import { envSchema } from "./env";

export type CreateContextOptions = {
	context: HonoContext<HonoEnv>;
};

export async function createContext({ context }: CreateContextOptions) {
	const env = envSchema.parse(context.env);
	const db = createDatabase(context.env.DB);
	const auth = createAuth(
		db,
		context.env.CORS_ORIGIN,
		context.env.RESEND_API_KEY,
	);
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return {
		session,
		env,
		db,
		auth,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
