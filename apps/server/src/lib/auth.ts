import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { drizzle } from "drizzle-orm/d1";
import { Resend } from "resend";
import * as schema from "../db/schema/auth";

async function sendEmail(
	param: { subject: string; to: string; text: string },
	resendApiKey: string,
) {
	const resend = new Resend(resendApiKey);

	await resend.emails.send({
		from: "Acme <onboarding@resend.dev>",
		to: ["maxence.amouroux@epitech.eu"],
		subject: param.subject,
		text: param.text,
	});
}

export function createAuth(
	database: ReturnType<typeof drizzle>,
	corsOrigin: string,
	resendApiKey: string,
) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "sqlite",
			schema: schema,
		}),
		trustedOrigins: [corsOrigin],
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url, token }, request) => {
				await sendEmail(
					{
						to: user.email,
						subject: "Reset your password",
						text: "Click the link to reset your password ",
					},
					resendApiKey,
				);
			},
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url, token }, request) => {
				const redirectUrl = new URL(url);

				const frontendUrl =
					process.env.NODE_ENV === "production"
						? "https://tonsite.com/dashboard"
						: "http://localhost:3001/";

				redirectUrl.searchParams.set("callbackURL", frontendUrl);

				await sendEmail(
					{
						to: user.email,
						subject: "Verify your email address",
						text: `Click the link to verify your email: ${redirectUrl}`,
					},
					resendApiKey,
				);
			},
			autoSignInAfterVerification: true,
			sendOnSignUp: true,
		},
	});
}
