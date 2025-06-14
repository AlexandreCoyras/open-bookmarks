import { drizzle } from "drizzle-orm/d1";

// Fonction pour créer une instance DB avec D1
export function createDatabase(d1: D1Database) {
	return drizzle(d1);
}

// Export par défaut pour la compatibilité (sera remplacé par le contexte en production)
export const db = null;
