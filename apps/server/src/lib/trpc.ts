import { TRPCError, initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError
						? error.cause.flatten()
						: null,
			},
		};
	},
});

// Middleware pour logger les erreurs
const loggerMiddleware = t.middleware(async ({ next, path, type }) => {
	const start = Date.now();
	const result = await next();

	const durationMs = Date.now() - start;

	if (result.ok) {
		console.log(`✅ ${type} ${path} - ${durationMs}ms`);
	} else {
		console.error(`❌ ${type} ${path} - ${durationMs}ms`);
		console.error("Error details:", result.error);
		console.error("Error cause:", result.error.cause);
	}

	return result;
});

export const router = t.router;

export const publicProcedure = t.procedure.use(loggerMiddleware);

export const protectedProcedure = t.procedure
	.use(loggerMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.session) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
				cause: "No session",
			});
		}
		return next({
			ctx: {
				...ctx,
				session: ctx.session,
			},
		});
	});
