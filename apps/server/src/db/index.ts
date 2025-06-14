import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(env.DATABASE_URL);
