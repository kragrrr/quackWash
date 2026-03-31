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
const DINNER_MENU_FILE = path.join(__dirname, "dinner-menu.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
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
const DEV_VIEWER_PASSWORD = process.env.DEV_VIEWER_PASSWORD || "replacejumpr";
const DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || "replacejumpr";

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

function ensureDinnerStorage() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    if (!fs.existsSync(DINNER_MENU_FILE)) {
        const defaultMenu = {
            type: "text",
            title: "What's for Dinner?",
            dateLabel: new Date().toLocaleDateString(),
            text: "No dinner menu uploaded yet.",
            filePath: null,
            mimeType: null,
            updatedAt: new Date().toISOString(),
        };
        fs.writeFileSync(DINNER_MENU_FILE, JSON.stringify(defaultMenu));
    }
}

function loadDinnerMenu() {
    ensureDinnerStorage();
    try {
        return JSON.parse(fs.readFileSync(DINNER_MENU_FILE, "utf-8"));
    } catch {
        return {
            type: "text",
            title: "What's for Dinner?",
            dateLabel: new Date().toLocaleDateString(),
            text: "No dinner menu uploaded yet.",
            filePath: null,
            mimeType: null,
            updatedAt: new Date().toISOString(),
        };
    }
}

function saveDinnerMenu(menu) {
    ensureDinnerStorage();
    fs.writeFileSync(DINNER_MENU_FILE, JSON.stringify(menu));
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalSize = 0;

        req.on("data", (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_UPLOAD_SIZE_BYTES) {
                reject(new Error("Payload too large"));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });

        req.on("end", () => {
            try {
                const raw = Buffer.concat(chunks).toString("utf-8");
                resolve(raw ? JSON.parse(raw) : {});
            } catch {
                reject(new Error("Invalid JSON payload"));
            }
        });

        req.on("error", reject);
    });
}

function getHeaderPassword(req, headerName) {
    const value = req.headers[headerName];
    return Array.isArray(value) ? value[0] : value;
}

function requirePassword(req, expected, headerName) {
    const provided = getHeaderPassword(req, headerName);
    return provided && provided === expected;
}

function safeUploadName(originalName, prefix) {
    const safeBase = (originalName || "upload")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-80);
    return `${Date.now()}-${prefix}-${safeBase}`;
}

function writeUploadedBase64File(fileName, mimeType, fileBase64, kind) {
    const isImage = kind === "image" && /^image\/(png|jpeg|jpg|webp|heic|heif)$/i.test(mimeType || "");
    const isPdf = kind === "pdf" && /^application\/pdf$/i.test(mimeType || "");
    if (!isImage && !isPdf) {
        throw new Error("Unsupported file type");
    }

    const fileBuffer = Buffer.from(fileBase64 || "", "base64");
    if (!fileBuffer.length || fileBuffer.length > MAX_UPLOAD_SIZE_BYTES) {
        throw new Error("Invalid file payload");
    }

    const uploadName = safeUploadName(fileName, kind);
    const fullPath = path.join(UPLOADS_DIR, uploadName);
    fs.writeFileSync(fullPath, fileBuffer);
    return `/uploads/${uploadName}`;
}

function cleanupOldUpload(filePathValue) {
    if (!filePathValue || !filePathValue.startsWith("/uploads/")) {
        return;
    }
    const absolutePath = path.join(UPLOADS_DIR, path.basename(filePathValue));
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
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
    ".heic": "image/heic",
    ".heif": "image/heif",
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

    if (pathname === "/api/dev/dinner-menu" && req.method === "GET") {
        if (!requirePassword(req, DEV_VIEWER_PASSWORD, "x-dev-viewer-password")) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Unauthorized" }));
        }

        const menu = loadDinnerMenu();
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        });
        return res.end(JSON.stringify(menu));
    }

    if (pathname === "/api/dev/dinner-menu" && req.method === "POST") {
        if (!requirePassword(req, DEV_ADMIN_PASSWORD, "x-dev-admin-password")) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Unauthorized" }));
        }

        return readJsonBody(req)
            .then((body) => {
                const type = body?.type;
                const title = String(body?.title || "What's for Dinner?");
                const dateLabel = String(body?.dateLabel || new Date().toLocaleDateString());
                const previous = loadDinnerMenu();

                if (type === "text") {
                    const text = String(body?.text || "").trim();
                    if (!text) {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ error: "Text menu cannot be empty" }));
                    }

                    cleanupOldUpload(previous.filePath);
                    const menu = {
                        type: "text",
                        title,
                        dateLabel,
                        text,
                        filePath: null,
                        mimeType: null,
                        updatedAt: new Date().toISOString(),
                    };
                    saveDinnerMenu(menu);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify(menu));
                }

                if (type === "image" || type === "pdf") {
                    const filePathValue = writeUploadedBase64File(
                        body?.fileName,
                        body?.mimeType,
                        body?.fileBase64,
                        type
                    );
                    cleanupOldUpload(previous.filePath);
                    const menu = {
                        type,
                        title,
                        dateLabel,
                        text: null,
                        filePath: filePathValue,
                        mimeType: body?.mimeType || null,
                        updatedAt: new Date().toISOString(),
                    };
                    saveDinnerMenu(menu);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify(menu));
                }

                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Invalid menu type" }));
            })
            .catch((error) => {
                const status = error.message === "Payload too large" ? 413 : 400;
                res.writeHead(status, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: error.message }));
            });
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

    if (pathname.startsWith("/uploads/")) {
        ensureDinnerStorage();
        const uploadPath = path.join(UPLOADS_DIR, path.basename(pathname));
        return fs.stat(uploadPath, (err, stats) => {
            if (!err && stats.isFile()) {
                const ext = path.extname(uploadPath).toLowerCase();
                const contentType = MIME_TYPES[ext] || "application/octet-stream";
                res.writeHead(200, { "Content-Type": contentType });
                fs.createReadStream(uploadPath).pipe(res);
                return;
            }
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "File not found" }));
        });
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
