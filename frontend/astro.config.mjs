// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
    adapter: vercel(),
    output: "static",
    build: {
        assets: "_astro",
    },
    vite: {
        build: {
            assetsInlineLimit: 0,
        },
    },
});
