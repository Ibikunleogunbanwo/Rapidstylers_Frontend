/**
 * PostCSS pipeline for Tailwind.
 *
 * Create React App used to append the `tailwindcss` plugin implicitly whenever
 * `tailwind.config.js` was present, so no PostCSS config file was needed. Vite
 * does not do that — Tailwind directives were passing through uncompiled — so
 * the plugin chain is declared here explicitly. `autoprefixer` replaces the
 * vendor-prefixing CRA was doing through `postcss-preset-env`.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
