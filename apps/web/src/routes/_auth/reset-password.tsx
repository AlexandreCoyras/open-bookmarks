import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod/v4";

export const Route = createFileRoute("/_auth/reset-password")({
	component: ResetPasswordRoute,
	// beforeLoad: async ({ context, location, search }) => {
	//     console.log(search.token)
	//     // if (typeof search.token === undefined) {
	//     //     throw redirect({
	//     //         to: "/", search: {
	//     //             redirect: location.href,
	//     //         }
	//     //     });
	//     // }
	// },
	validateSearch: (search) =>
		z.object({ token: z.string("No token detected.") }).parse(search),
});

function ResetPasswordRoute() {
	const navigate = useNavigate();
	const token = Route.useSearch().token;

	const form = useForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			const { data, error } = await authClient.resetPassword(
				{
					newPassword: value.password,
					token,
				},
				{
					onSuccess: () => {
						toast.success("Password reset successful");
						navigate({ to: "/login" });
					},
					onError: ({ error }) => {
						toast.error(error.message);
					},
				},
			);
		},
		validators: {
			onSubmit: z
				.object({
					password: z
						.string()
						.min(8, "Password must be at least 8 characters"),
					confirmPassword: z
						.string()
						.min(8, "Password must be at least 8 characters"),
				})
				.refine((data) => data.password === data.confirmPassword, {
					message: "Passwords do not match",
					path: ["confirmPassword"],
				}),
		},
	});

	if (!token) {
		redirect({
			to: "/",
		});
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">
				Reset your password
			</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>New password</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										key={error?.message}
										className="text-red-500"
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="confirmPassword">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>
									Confirm your new password
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value)
									}
								/>
								{field.state.meta.errors.map((error) => (
									<p
										key={error?.message}
										className="text-red-500"
									>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting
								? "Resetting..."
								: "Reset Password"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
