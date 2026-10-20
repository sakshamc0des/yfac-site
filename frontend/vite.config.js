import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const copySiteAssets = {
  name: "copy-yfac-public-assets",
  closeBundle() {
    mkdirSync("dist", { recursive: true });
    cpSync("img", "dist/img", { recursive: true });
    copyFileSync("config.js", "dist/config.js");
    copyFileSync("sw.js", "dist/sw.js");
  },
};

export default defineConfig({
  plugins: [react(), copySiteAssets],
});
