import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const root = process.cwd();

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url ?? "/", `http://localhost:${port}`).pathname);
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const resolved = resolve(root, `.${sep}${normalized}`);
  if (!resolved.startsWith(root)) return null;
  if (existsSync(resolved) && statSync(resolved).isDirectory()) {
    return join(resolved, "index.html");
  }
  return resolved;
}

createServer((request, response) => {
  const filePath = resolveRequestPath(request.url);
  if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Ancient Defense Web Preview: http://localhost:${port}/platform-web/`);
});
