// @ts-check
import tailwindcss from "@tailwindcss/vite";
import varlockAstroIntegration from "@varlock/astro-integration";
import { defineConfig } from "astro/config";

import { SITE_URL } from "./src/site.config.ts";

// Fully static marketing site — deploy the `dist/` folder to any static host.
export default defineConfig({
	site: SITE_URL,
	output: "static",
	integrations: [varlockAstroIntegration()],
	vite: {
		plugins: [tailwindcss()],
	},
});
