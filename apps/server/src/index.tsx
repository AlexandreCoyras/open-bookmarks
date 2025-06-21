import DefaultEmails from "@/emails/default-emails";
import VercelInviteUserEmail from "@/emails/vercel-email";
import { google } from "@ai-sdk/google";
import { trpcServer } from "@hono/trpc-server";
import { streamText } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { stream } from "hono/streaming";
import { Resend } from "resend";
import { createContext } from "./lib/context";
import type { HonoEnv } from "./lib/env";
import { appRouter } from "./routers/index";

const app = new Hono<HonoEnv>();

app.use(logger());

app.use("/*", async (c, next) => {
	const corsOrigin = c.env.CORS_ORIGIN || "*";

	const corsMiddleware = cors({
		origin: (origin) => {
			// En développement, accepter tous les origines
			if (
				process.env.NODE_ENV === "development" ||
				process.env.NODE_ENV === "test"
			) {
				return origin;
			}

			if (origin === corsOrigin) {
				return origin;
			}
			return null;
		},
		allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		credentials: true,
	});

	return corsMiddleware(c, next);
});

app.on(["POST", "GET"], "/api/auth/**", async (c) => {
	const context = await createContext({ context: c });

	return context.auth.handler(c.req.raw);
});

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.post("/ai", async (c) => {
	const body = await c.req.json();
	const messages = body.messages || [];

	const result = streamText({
		model: google("gemini-1.5-flash"),
		messages,
	});

	c.header("X-Vercel-AI-Data-Stream", "v1");
	c.header("Content-Type", "text/plain; charset=utf-8");

	return stream(c, (stream) => stream.pipe(result.toDataStream()));
});

app.post("/send/email", async (c) => {
	const resend = new Resend(c.env.RESEND_API_KEY);

	const data = await resend.emails.send({
		from: "Acme <onboarding@resend.dev>",
		to: ["maxence.amouroux@epitech.eu"],
		subject: "Subscribe on my instagram",
		react: <DefaultEmails firstName={"Michel"} />,
	});

	return c.json(data);
});

app.post("/send/email/vercel", async (c) => {
	const resend = new Resend(c.env.RESEND_API_KEY);

	const data = await resend.emails.send({
		from: "Acme <onboarding@resend.dev>",
		to: ["maxence.amouroux@epitech.eu"],
		subject: "Subscribe on my instagram",
		react: (
			<VercelInviteUserEmail
				username={"Max"}
				teamName={"MaxTeam"}
				invitedByUsername={"MaxTeam"}
				invitedByEmail={"max@gmail.com"}
			/>
		),
	});

	return c.json(data);
});

app.get("/", (c) => {
	return c.text("cheval");
});

export default app;
