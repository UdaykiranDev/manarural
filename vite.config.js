import { copyFile } from "node:fs/promises";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/manarural/",
  plugins: [
    {
      name: "github-pages-spa-fallback",
      apply: "build",
      async closeBundle() {
        await copyFile("dist/index.html", "dist/404.html");
      },
    },
  ],
});
