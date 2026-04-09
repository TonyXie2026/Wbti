import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const requestedPort = Number(process.env.PORT || 4173);
let activePort = requestedPort;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function isWithin(basePath, targetPath) {
  const relativePath = path.relative(basePath, targetPath);
  return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function normalizeRequestPath(requestUrl) {
  const pathname = new URL(requestUrl, "http://localhost").pathname;
  return decodeURIComponent(pathname);
}

function resolveFilePath(pathname) {
  if (pathname === "/") {
    return path.join(rootDir, "index.html");
  }

  const relativePath = pathname.replace(/^\/+/, "");
  return path.join(rootDir, relativePath);
}

async function readFileSafely(filePath) {
  const normalizedTarget = path.normalize(filePath);
  const inRoot = normalizedTarget === path.join(rootDir, "index.html") || isWithin(rootDir, normalizedTarget);

  if (!inRoot) {
    return { status: 403, body: "Forbidden", type: "text/plain; charset=utf-8" };
  }

  try {
    const stats = await fs.stat(normalizedTarget);

    if (stats.isDirectory()) {
      return { status: 404, body: "Not Found", type: "text/plain; charset=utf-8" };
    }

    const data = await fs.readFile(normalizedTarget);
    const extension = path.extname(normalizedTarget).toLowerCase();
    const type = mimeTypes[extension] || "application/octet-stream";

    return { status: 200, body: data, type };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { status: 404, body: "Not Found", type: "text/plain; charset=utf-8" };
    }

    console.error(error);
    return { status: 500, body: "Internal Server Error", type: "text/plain; charset=utf-8" };
  }
}

const server = createServer(async (request, response) => {
  const pathname = normalizeRequestPath(request.url || "/");
  const filePath = resolveFilePath(pathname);
  const { status, body, type } = await readFileSafely(filePath);

  response.writeHead(status, { "Content-Type": type });
  response.end(body);
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    activePort += 1;
    server.listen(activePort);
    return;
  }

  console.error(error);
  process.exit(1);
});

server.listen(activePort, () => {
  const portNote =
    activePort === requestedPort
      ? `http://localhost:${activePort}`
      : `http://localhost:${activePort} (auto-switched because 4173 was busy)`;

  console.log(`internet-persona-test running at ${portNote}`);
});
