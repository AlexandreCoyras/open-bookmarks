import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const bookmarkCollection = sqliteTable("bookmark_collection", {
	id: text("id").primaryKey().notNull().default(sql`(uuid())`),
	title: text("title").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	parentId: text("parent_id").references(
		(): AnySQLiteColumn => bookmarkCollection.id,
		{ onDelete: "cascade" },
	),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	isMainBookmarkCollection: integer("is_main_bookmark_collection", {
		mode: "boolean",
	})
		.generatedAlwaysAs(sql`(
		CASE
			WHEN parent_id IS NULL THEN 1
			ELSE 0
		END
	)`)
		.notNull(),
});

export const bookmark = sqliteTable("bookmark", {
	id: text("id").primaryKey().notNull().default(sql`(uuid())`),
	name: text("name").notNull(),
	url: text("url").notNull(),
	image: text("image"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	collectionId: text("collection_id").references(
		() => bookmarkCollection.id,
		{ onDelete: "cascade" },
	),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	isMainBookmark: integer("is_main_bookmark", {
		mode: "boolean",
	})
		.generatedAlwaysAs(sql`(
		CASE
			WHEN collection_id IS NULL THEN 1
			ELSE 0
		END
	)`)
		.notNull(),
});
