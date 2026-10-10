// Serve the production build with the configured Vercel security headers.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("build");
const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
const headers = vercel.headers.find(rule => rule.source === "/(.*)")?.headers || [];
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4", ".otf": "font/otf" };

createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = resolve(root, `.${path}`);
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(400); response.end(); return; }
    try { if (!(await stat(file)).isFile()) file = resolve(root, "index.html"); }
    catch (_) { file = resolve(root, "index.html"); }
    for (const { key, value } of headers) response.setHeader(key, value);
    response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    response.end(await readFile(file));
  } catch (_) { response.writeHead(500); response.end("Unable to serve test build"); }
}).listen(4173, "127.0.0.1", () => console.log("Functional build: http://127.0.0.1:4173"));
