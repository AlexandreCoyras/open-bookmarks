import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	component: () => <Outlet />,
	beforeLoad: ({ context }) => {
		return { ...context, hideHeader: true };
	},
});
