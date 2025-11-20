import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
        Icons({ compiler: "svelte" }),
        paraglideVitePlugin({
            project: "./project.inlang",
            outdir: "./src/lib/paraglide"
        })
    ],
    optimizeDeps: {
        exclude: ["@takumi-rs/core", "@takumi-rs/image-response"]
    },
    ssr: {
        external: ["@takumi-rs/image-response", "@takumi-rs/core"]
    },
    build: {
        rollupOptions: {
            external: ["@takumi-rs/core", "@takumi-rs/image-response"]
        }
    }
});
