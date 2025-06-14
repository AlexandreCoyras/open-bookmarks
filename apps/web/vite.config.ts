import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackRouter(),
		react(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "open-bookmarks",
				short_name: "open-bookmarks",
				description: "open-bookmarks - PWA Application",
				theme_color: "#0c0c0c",
			},
			pwaAssets: {
				disabled: false,
				config: true,
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},
			},
		},
	},
	// Configuration pour Cloudflare Pages
	define: {
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
	},
});
