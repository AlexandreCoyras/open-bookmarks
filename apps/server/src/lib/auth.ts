import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema/auth";

export function createAuth(
	database: ReturnType<typeof drizzle>,
	corsOrigin: string,
) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "sqlite",
			schema: schema,
		}),
		trustedOrigins: [corsOrigin],
		emailAndPassword: {
			enabled: true,
		},
	});
}
