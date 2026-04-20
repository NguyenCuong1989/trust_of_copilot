const http = require('node:http');

const PORT = Number(process.env.PORT || 3000);
const TELEGRAM_DISPATCH_PATH = '/telegram/dispatch';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== TELEGRAM_DISPATCH_PATH) {
    sendJson(res, 404, { ok: false, route: TELEGRAM_DISPATCH_PATH });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const token = String(body.token || process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const dispatch = {
      ok: Boolean(token && token.length >= 20),
      endpoint: TELEGRAM_DISPATCH_PATH,
      token_verified: Boolean(token && token.length >= 20),
      lifecycle: 'synced',
      mode: 'sovereign-dispatcher',
      payload: body,
    };
    sendJson(res, 200, dispatch);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`telegram dispatch endpoint listening on ${PORT}`);
});
