import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { drizzle } from "drizzle-orm/d1";
import React from "react";
import { Resend } from "resend";
import * as schema from "../db/schema/auth";
import ResetPasswordEmail from "../emails/reset-password";

async function sendEmail(
	param: {
		subject: string;
		to: string;
		text: string;
		template: React.ReactNode | undefined;
	},
	resendApiKey: string,
) {
	const resend = new Resend(resendApiKey);

	await resend.emails.send({
		from: "Open Bookmark <openbookmark@resend.dev>",
		to: [param.to ?? "maxence.amouroux@epitech.eu"],
		subject: param.subject,
		text: param.text,
		react: param.template ?? undefined,
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
						// to: user.email,
						to: "maxence.amouroux@epitech.eu",
						subject: "Reset your password",
						text: `Click the link to reset your password: ${url}`,
						template: React.createElement(ResetPasswordEmail, {
							userFirstname: user?.name ?? undefined,
							resetPasswordLink: url,
						}),
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
						template: undefined,
					},
					resendApiKey,
				);
			},
			autoSignInAfterVerification: true,
			sendOnSignUp: true,
		},
	});
}
