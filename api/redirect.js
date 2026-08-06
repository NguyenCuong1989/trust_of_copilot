import fs from "node:fs";
import path from "node:path";

const SHORTCODES_PATH = path.join(process.cwd(), "data", "shortcodes.json");

const DEFAULT_STATUS = 302;
const VANILLA_HOSTS = {
  "view-link.cx": "view-link",
  "view-details.cx": "view-details",
};

function loadMappings() {
  try {
    const raw = fs.readFileSync(SHORTCODES_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function normalizeHost(rawHost) {
  if (!rawHost) return "";
  return rawHost.toLowerCase().replace(/:\d+$/, "");
}

function extractCode(request) {
  if (request.query?.code) {
    return String(request.query.code).trim();
  }

  const url = new URL(request.url || "/", "https://placeholder.local");
  return url.pathname.replace(/^\/+/, "").split("/")[0].trim();
}

export default async function handler(request, response) {
  const host = normalizeHost(request.headers.host || request.headers["x-forwarded-host"]);
  const code = extractCode(request);

  if (!code || !host) {
    return response.status(400).json({
      ok: false,
      error: "missing_shortcode_or_host",
      code,
      host,
    });
  }

  const mappings = loadMappings();
  const key = `${host}/${code}`;
  const target = mappings[key];

  if (!target) {
    return response.status(404).json({
      ok: false,
      error: "shortcode_not_found",
      code,
      host,
    });
  }

  response.setHeader("Cache-Control", "no-store, private, max-age=0, no-cache, must-revalidate");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");

  return response.status(DEFAULT_STATUS).setHeader("Location", target).end("Redirecting...");
}
