import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "dist");
const VISITORS_FILE = path.join(__dirname, "visitors.json");
const MACHINE_HISTORY_FILE = path.join(__dirname, "machine-history.json");
const TANGERPAY_CACHE_TTL_MS = 30_000;
const MACHINE_HISTORY_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const MACHINE_HISTORY_MAX_ENTRIES = 10_000;
const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
]);
const tangerpayCache = new Map();
const tangerpayInflight = new Map();

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function loadVisitors() {
    try {
        return JSON.parse(fs.readFileSync(VISITORS_FILE, "utf-8"));
    } catch {
        return {};
    }
}

function saveVisitors(data) {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(data));
}

function loadMachineHistory() {
    try {
        return JSON.parse(fs.readFileSync(MACHINE_HISTORY_FILE, "utf-8"));
    } catch {
        return [];
    }
}

function saveMachineHistory(history) {
    fs.writeFileSync(MACHINE_HISTORY_FILE, JSON.stringify(history));
}

function recordVisit(ip) {
    const data = loadVisitors();
    const day = todayKey();
    if (!data[day]) data[day] = [];
    if (!data[day].includes(ip)) {
        data[day].push(ip);
        saveVisitors(data);
    }
    return data[day].length;
}

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

function isSuccessfulResponse(statusCode) {
    return statusCode >= 200 && statusCode < 300;
}

function normalizeResponseHeaders(headers, body) {
    const normalized = {};

    for (const [name, value] of Object.entries(headers)) {
        if (value == null || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
            continue;
        }

        normalized[name] = value;
    }

    normalized["content-length"] = Buffer.byteLength(body);
    return normalized;
}

function sendBufferedResponse(res, payload) {
    res.writeHead(payload.statusCode, payload.headers);
    res.end(payload.body);
}

function getCachedTangerpayResponse(cacheKey) {
    const cached = tangerpayCache.get(cacheKey);
    if (!cached) {
        return null;
    }

    if (cached.expiresAt <= Date.now()) {
        tangerpayCache.delete(cacheKey);
        return null;
    }

    return cached;
}

function pruneMachineHistory(history) {
    const cutoff = Date.now() - MACHINE_HISTORY_RETENTION_MS;
    const recentHistory = history.filter((entry) => {
        const fetchedAt = Date.parse(entry.fetchedAt);
        return Number.isFinite(fetchedAt) && fetchedAt >= cutoff;
    });

    if (recentHistory.length <= MACHINE_HISTORY_MAX_ENTRIES) {
        return recentHistory;
    }

    return recentHistory.slice(-MACHINE_HISTORY_MAX_ENTRIES);
}

function extractSiteId(apiPath) {
    const match = apiPath.match(/^\/Sites\/([^/?]+)/);
    return match ? match[1] : null;
}

function persistMachineSnapshot(apiPath, body) {
    const siteId = extractSiteId(apiPath);
    if (!siteId) {
        return;
    }

    try {
        const parsed = JSON.parse(body.toString("utf-8"));
        if (!Array.isArray(parsed?.machines)) {
            return;
        }

        const history = loadMachineHistory();
        history.push({
            fetchedAt: new Date().toISOString(),
            siteId,
            machines: parsed.machines,
        });

        saveMachineHistory(pruneMachineHistory(history));
    } catch (error) {
        console.error("Machine history persistence error:", error.message);
    }
}

function fetchTangerpay(apiPath) {
    const targetUrl = `https://app.tangerpay.com/api${apiPath}`;

    return new Promise((resolve, reject) => {
        https
            .get(targetUrl, (proxyRes) => {
                const chunks = [];

                proxyRes.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                proxyRes.on("end", () => {
                    const body = Buffer.concat(chunks);
                    const payload = {
                        statusCode: proxyRes.statusCode || 502,
                        headers: normalizeResponseHeaders(proxyRes.headers, body),
                        body,
                    };

                    if (isSuccessfulResponse(payload.statusCode)) {
                        persistMachineSnapshot(apiPath, body);
                    }

                    resolve(payload);
                });
            })
            .on("error", (err) => {
                reject(err);
            });
    });
}

async function proxyTangerpay(_req, res, apiPath) {
    const cacheKey = apiPath;
    const cached = getCachedTangerpayResponse(cacheKey);
    if (cached) {
        return sendBufferedResponse(res, cached);
    }

    let inflight = tangerpayInflight.get(cacheKey);
    if (!inflight) {
        inflight = fetchTangerpay(apiPath)
            .then((payload) => {
                if (isSuccessfulResponse(payload.statusCode)) {
                    tangerpayCache.set(cacheKey, {
                        ...payload,
                        expiresAt: Date.now() + TANGERPAY_CACHE_TTL_MS,
                    });
                }

                return payload;
            })
            .finally(() => {
                tangerpayInflight.delete(cacheKey);
            });

        tangerpayInflight.set(cacheKey, inflight);
    }

    try {
        const payload = await inflight;
        sendBufferedResponse(res, payload);
    } catch (err) {
        console.error("Proxy error:", err.message);
        res.writeHead(502);
        res.end("Bad Gateway");
    }
}

// Proxy /api/tfnsw/* → https://api.transport.nsw.gov.au/v1/tp/*
function proxyTfnsw(req, res, apiPath) {
    const targetUrl = new URL(`https://api.transport.nsw.gov.au/v1/tp${apiPath}`);

    const options = {
        hostname: targetUrl.hostname,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
            ...req.headers,
            host: targetUrl.hostname
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        // Set CORS headers so the local app can consume it
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
        console.error("TfNSW Proxy error:", err.message);
        res.writeHead(502);
        res.end("Bad Gateway");
    });

    req.pipe(proxyReq);
}


const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Visitor counter
    if (pathname === "/api/visitors") {
        const ip =
            (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
            req.socket.remoteAddress ||
            "unknown";
        const count = recordVisit(ip);
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        });
        return res.end(JSON.stringify({ count }));
    }

    // Handle API proxy
    if (pathname.startsWith("/api/tangerpay")) {
        // Extract the path including query parameters from req.url
        const apiPath = req.url.replace(/^\/api\/tangerpay/, "");
        return proxyTangerpay(req, res, apiPath);
    }

    if (pathname.startsWith("/api/tfnsw")) {
        // Extract the path including query parameters from req.url
        const apiPath = req.url.replace(/^\/api\/tfnsw/, "");
        return proxyTfnsw(req, res, apiPath);
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
