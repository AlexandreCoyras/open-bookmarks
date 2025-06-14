import { eq } from "drizzle-orm";
import z from "zod/v4";
import { todo } from "../db/schema/todo";
import { publicProcedure, router } from "../lib/trpc";

export const todoRouter = router({
	getAll: publicProcedure.query(async ({ ctx }) => {
		console.log(ctx.env.BETTER_AUTH_SECRET);
		// En production, utilise la DB D1 du contexte
		if (!ctx.db) {
			throw new Error("Database not available");
		}
		return await ctx.db.select().from(todo);
	}),

	create: publicProcedure
		.input(z.object({ text: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			if (!ctx.db) {
				throw new Error("Database not available");
			}
			return await ctx.db.insert(todo).values({
				text: input.text,
			});
		}),

	toggle: publicProcedure
		.input(z.object({ id: z.number(), completed: z.boolean() }))
		.mutation(async ({ input, ctx }) => {
			if (!ctx.db) {
				throw new Error("Database not available");
			}
			return await ctx.db
				.update(todo)
				.set({ completed: input.completed })
				.where(eq(todo.id, input.id));
		}),

	delete: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			if (!ctx.db) {
				throw new Error("Database not available");
			}
			return await ctx.db.delete(todo).where(eq(todo.id, input.id));
		}),
});
