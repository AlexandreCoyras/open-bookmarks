import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";

// Fonction pour créer une instance DB avec D1
export function createDatabase(d1: D1Database) {
	return drizzle(d1);
}
