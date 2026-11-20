import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server falls back to the app for unknown paths, which would
// swallow /admin/. Cloudflare Pages serves public/admin/index.html there, so mirror that.
const serveAdmin = {
  name: "serve-admin",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === "/admin" || req.url === "/admin/") req.url = "/admin/index.html";
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), serveAdmin],
  build: {
    cssMinify: false,
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.js", "functions/**/*.test.js", "cms-auth/**/*.test.js", "src/**/*.test.js"],
  },
});
