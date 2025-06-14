import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";

const envSchema = z.object({
	CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN est requis"),
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, "BETTER_AUTH_SECRET doit faire au moins 32 caractères"),
	BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL doit être une URL valide"),

	// API Keys
	GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export interface HonoEnv {
	Bindings: Env & {
		DB: D1Database;
		// Autres bindings possibles
		// BUCKET?: R2Bucket;
		// KV?: KVNamespace;
		// AI?: Ai;
	};
	Variables: Record<string, unknown>;
}

export { envSchema };
