import { join } from "node:path";

const port = Number(process.env.PORT) || 3000;
const projectRoot = join(import.meta.dirname || ".", "..");
const webDir = join(projectRoot, "dist", "web");

console.log(`🚀 Serving Gistwarden Web Vault at http://localhost:${port}`);

Bun.serve({
  port,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    const filePath = join(webDir, pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Fallback to index.html ONLY for SPA navigation routes (not static assets like .jpg, .png, .js, .css)
    if (!pathname.includes(".")) {
      const indexFile = Bun.file(join(webDir, "index.html"));
      return new Response(indexFile);
    }

    return new Response("Asset Not Found", { status: 404 });
  },
});
