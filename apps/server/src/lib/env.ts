import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().url("DATABASE_URL doit être une URL valide"),
	DATABASE_URL_POOLER: z
		.string()
		.url("DATABASE_URL_POOLER doit être une URL valide"),

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

// Validation et export des variables d'environnement
export const env = envSchema.parse(process.env);

// Export du schéma pour une utilisation ailleurs si nécessaire
export { envSchema };
