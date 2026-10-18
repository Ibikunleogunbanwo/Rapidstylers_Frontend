import { defineConfig, loadEnv, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PRERENDERED_ROUTES, addFacebookAppId, addNoindex, applyHeadTags, facebookAppId, pageMeta } from "./src/seo/pageMeta.mjs";
import { demoQaBuildEnv } from "./src/utils/demoQaBuild.mjs";

/**
 * Compiles JSX that lives in plain `.js` files — the Create React App
 * convention this codebase is written in.
 *
 * Vite 8 (rolldown/oxc) only enables JSX for `.jsx`/`.tsx`: `.js` files are
 * parsed as plain JavaScript, so every component here failed to build with
 * "Unexpected JSX expression ... JSX syntax is disabled". Neither
 * `oxc.jsx` nor `build.rollupOptions.moduleTypes` changes that for `.js`
 * (see vitejs/vite#21505), so the file is transformed explicitly with the
 * oxc `jsx` loader before Vite's own transform sees it. The dev dependency
 * scanner is a separate pipeline and takes `optimizeDeps.rolldownOptions`
 * (see below).
 *
 * `refresh` mirrors plugin-react's own fast-refresh gate, so dev keeps HMR
 * instead of degrading to full page reloads.
 */
const transformJsxInJs = () => {
  let refresh = false;
  return {
    name: "rapidstylers:jsx-in-js",
    enforce: "pre",
    configResolved(config) {
      refresh =
        config.command === "serve" &&
        !config.isProduction &&
        config.server?.hmr !== false;
    },
    async transform(code, id) {
      const [filepath] = id.split("?");
      if (!filepath.endsWith(".js") || filepath.includes("/node_modules/")) {
        return null;
      }
      return await transformWithOxc(code, filepath, {
        lang: "jsx",
        jsx: { runtime: "automatic", importSource: "react", refresh },
        sourcemap: true,
      });
    },
  };
};

/**
 * Gives every fixed public page its own link-preview and search metadata in
 * the HTML the server sends, for crawlers that never run the app (Facebook,
 * WhatsApp, iMessage, X, LinkedIn, Slack).
 *
 * After the build writes `build/index.html`, this writes
 * `build/<route>/index.html` for each route in PRERENDERED_ROUTES: the same
 * shell, byte for byte, except for the title, description, canonical, og:* and
 * twitter:* tags (see src/seo/pageMeta.mjs). Same scripts, same root element,
 * so the app boots exactly as it does from `/`. Vercel serves the file for
 * `/about` etc. (vercel.json rewrites make that explicit); so does
 * scripts/serve-functional.mjs for the e2e suite.
 *
 * On the demo build (REACT_APP_DEMO_MODE=true) every shell also carries
 * `noindex`, so the showroom stays out of search before any script runs.
 * When REACT_APP_FACEBOOK_APP_ID is set, every shell carries fb:app_id.
 */
const prerenderPageMeta = ({ demo, fbAppId }) => {
  let outDir = "build";
  return {
    name: "rapidstylers:page-meta",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      const withAppId = addFacebookAppId(html, fbAppId);
      return demo ? addNoindex(withAppId) : withAppId;
    },
    async writeBundle() {
      const shell = await readFile(resolve(outDir, "index.html"), "utf8");
      for (const route of PRERENDERED_ROUTES) {
        const file = resolve(outDir, `.${route}`, "index.html");
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, applyHeadTags(shell, pageMeta(route, { noindex: demo, fbAppId })));
      }
    },
  };
};

/**
 * Vite build + test config (migrated from Create React App / react-scripts).
 *
 * Deliberate compatibility choices so nothing else has to change:
 *
 *  - **Env names stay `REACT_APP_*`.** Vercel's environment variables do NOT need
 *    renaming, and every existing `process.env.REACT_APP_*` reference in `src/`
 *    keeps working verbatim — the values are injected at build time below.
 *  - **Output layout matches CRA.** Build goes to `build/` (Vite's default is
 *    `dist/`) with assets under `static/`, and the entry chunk keeps CRA's
 *    `static/js/main.<hash>.js` name. That keeps `vercel.json`'s immutable
 *    cache rule for `/static/*`, the `Cache-Control: no-store` rule on
 *    `/index.html`, and the stale-shell recovery guard in `src/index.js`
 *    (which looks for `/static/js/main.`) working untouched.
 *  - **Tests run on Vitest** with jsdom and globals, so the specs keep their
 *    Jest shape (`describe`/`it`/`vi.fn()`). Three Jest↔Vitest behaviour gaps
 *    had to be fixed in the specs themselves — see CONTRIBUTING.md.
 */
export default defineConfig(({ mode }) => {
  // Load .env / .env.local etc. and expose REACT_APP_* as process.env.*
  const loadedEnv = loadEnv(mode, process.cwd(), "REACT_APP_");
  const env = mode === "demo-qa" ? demoQaBuildEnv(loadedEnv) : loadedEnv;
  const processEnv = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  );

  return {
    plugins: [react(), transformJsxInJs(), prerenderPageMeta({ demo: mode === "demo-qa" || env.REACT_APP_DEMO_MODE === "true", fbAppId: facebookAppId(env) })],
    define: processEnv,
    build: {
      outDir: "build",
      emptyOutDir: true,
      // Consumed by scripts/verify-build-chunks.js (the CI chunk-integrity gate).
      manifest: true,
      rollupOptions: {
        output: {
          // Keep CRA's `static/...` layout and the `static/js/main.<hash>.js`
          // entry name: `vercel.json`'s immutable cache rule matches `/static/*`
          // and the stale-shell guard in src/index.js looks for that entry.
          entryFileNames: "static/js/main.[hash].js",
          chunkFileNames: "static/js/[name].[hash].js",
          assetFileNames: ({ names }) => {
            const source = names?.[0] ?? "";
            return source.endsWith(".css")
              ? "static/css/[name].[hash][extname]"
              : "static/media/[name].[hash][extname]";
          },
        },
      },
    },
    // The dev dependency scanner has its own parser and needs its own override:
    // without it the scan fails on JSX-in-`.js` and Vite silently skips
    // dependency pre-bundling (slow dev, and no CJS interop for bare imports).
    optimizeDeps: { rolldownOptions: { moduleTypes: { ".js": "jsx" } } },
    server: { port: 3000 },
    preview: { port: 3000 },
    test: {
      include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
    },
  };
});
