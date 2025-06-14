import "dotenv/config";
import { z } from "zod";

// Types Cloudflare Workers
declare global {
	interface D1Database {
		prepare(query: string): D1PreparedStatement;
		dump(): Promise<ArrayBuffer>;
		batch<T = unknown>(
			statements: D1PreparedStatement[],
		): Promise<D1Result<T>[]>;
		exec(query: string): Promise<D1ExecResult>;
	}

	interface D1PreparedStatement {
		bind(...values: unknown[]): D1PreparedStatement;
		first<T = unknown>(colName?: string): Promise<T>;
		run(): Promise<D1Result>;
		all<T = unknown>(): Promise<D1Result<T>>;
		raw<T = unknown>(): Promise<T[]>;
	}

	interface D1Result<T = Record<string, unknown>> {
		results?: T[];
		success: boolean;
		error?: string;
		meta: {
			duration: number;
			size_after: number;
			rows_read: number;
			rows_written: number;
		};
	}

	interface D1ExecResult {
		count: number;
		duration: number;
	}
}

const envSchema = z.object({
	DATABASE_URL: z.string().url("DATABASE_URL doit être une URL valide"),
	DATABASE_URL_POOLER: z
		.string()
		.url("DATABASE_URL_POOLER doit être une URL valide")
		.optional(),

	CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN est requis"),
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, "BETTER_AUTH_SECRET doit faire au moins 32 caractères"),
	BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL doit être une URL valide"),

	// API Keys
	GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
});

// Type TypeScript généré à partir du schéma Zod
export type Env = z.infer<typeof envSchema>;

// Type pour le contexte Hono avec Cloudflare
export interface HonoEnv {
	Bindings: Env & {
		// Bindings Cloudflare
		DB?: D1Database;
		// Autres bindings possibles
		// BUCKET?: R2Bucket;
		// KV?: KVNamespace;
		// AI?: Ai;
	};
	Variables: Record<string, unknown>;
}

// Validation et export des variables d'environnement
// En développement local, utilise process.env
// En production Cloudflare, les variables seront dans context.env
export const env =
	typeof process !== "undefined" && process.env
		? envSchema.parse(process.env)
		: ({} as Env); // Sera rempli par le contexte Cloudflare

// Export du schéma pour une utilisation ailleurs si nécessaire
export { envSchema };
