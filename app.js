import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "dist");

const MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".txt": "text/plain",
    ".webmanifest": "application/manifest+json",
};

// Proxy /api/tangerpay/* → https://app.tangerpay.com/api/*
function proxyTangerpay(req, res, apiPath) {
    const targetUrl = `https://app.tangerpay.com/api${apiPath}`;

    https
        .get(targetUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        })
        .on("error", (err) => {
            console.error("Proxy error:", err.message);
            res.writeHead(502);
            res.end("Bad Gateway");
        });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Handle API proxy
    if (pathname.startsWith("/api/tangerpay")) {
        const apiPath = pathname.replace(/^\/api\/tangerpay/, "");
        return proxyTangerpay(req, res, apiPath);
    }

    // Resolve the file path within dist/
    const filePath = path.join(DIST_DIR, pathname);

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            // Serve the static file
            const ext = path.extname(filePath);
            const contentType = MIME_TYPES[ext] || "application/octet-stream";
            res.writeHead(200, { "Content-Type": contentType });
            fs.createReadStream(filePath).pipe(res);
        } else {
            // SPA fallback — serve index.html for all non-file routes
            const indexPath = path.join(DIST_DIR, "index.html");
            fs.readFile(indexPath, (readErr, data) => {
                if (readErr) {
                    res.writeHead(500);
                    res.end("Server Error — has the project been built?");
                    return;
                }
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(data);
            });
        }
    });
});

server.listen(process.env.PORT || 3000);
