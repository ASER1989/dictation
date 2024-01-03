/** @type {import('vite').UserConfig} */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const { compression: viteCompression } = require("vite-plugin-compression2");

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    root: "./",
    base: "./",
    resolve: {
      alias: {
        "@client": path.resolve(__dirname, "./src"),
      },
    },
    mode,
    server: {
      port: 2413,
      strictPort: true,
      hmr: true,
    },
    esbuild: {
      pure: ["console.log"],
      drop: ["debugger"],
      legalComments: "none",
    },
    plugins: [
      react(),
      viteCompression({
        algorithm: "gzip",
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),
      viteCompression({
        algorithm: "brotliCompress",
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),
    ],
    build: {
      rollupOptions: {
        input: ["./index.html"],
      },
      outDir: "dist",
      sourcemap: command === "serve",
      minify: command === "build",
    },
  };
});
