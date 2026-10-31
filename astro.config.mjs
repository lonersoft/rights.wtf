// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://rights.wtf",
	prefetch: {
		prefetchAll: true,
	},
	integrations: [sitemap()],
	vite: {
		plugins: [tailwindcss()],
	},
	adapter: cloudflare(),
});
