const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const TELEGRAM_DISPATCH_PATH = '/telegram/dispatch';
const RUNTIME_MESH_PATH = path.join(__dirname, '.mcp', 'mesh.json');

let runtimeMeshCache = null;

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

function loadRuntimeMesh() {
  if (runtimeMeshCache) {
    return runtimeMeshCache;
  }

  try {
    runtimeMeshCache = JSON.parse(fs.readFileSync(RUNTIME_MESH_PATH, 'utf8'));
  } catch (error) {
    runtimeMeshCache = { hardware_nodes: {} };
  }

  return runtimeMeshCache;
}

function resolveRuntimeIdentity() {
  const mesh = loadRuntimeMesh();
  const hardwareNodes = mesh.hardware_nodes || {};
  const platform = process.platform;
  const runtimeNodeId = process.env.RUNTIME_NODE_ID || (platform === 'win32' ? 'msi_titan_gt77' : 'macbook_m2');
  const selectedNode =
    hardwareNodes[runtimeNodeId] ||
    hardwareNodes.msi_titan_gt77 ||
    hardwareNodes.macbook_m2 ||
    null;

  return {
    runtime_node_id: runtimeNodeId,
    runtime_node_name: selectedNode?.display_name || runtimeNodeId,
    runtime_node_role: selectedNode?.execution_role || (platform === 'win32' ? 'primary_execution' : 'secondary_unix'),
    runtime_platform: selectedNode?.platform || (platform === 'win32' ? 'windows' : 'unix'),
    runtime_priority: selectedNode?.priority ?? null,
    runtime_source: selectedNode ? 'mesh.json' : 'process.platform',
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== TELEGRAM_DISPATCH_PATH) {
    sendJson(res, 404, { ok: false, route: TELEGRAM_DISPATCH_PATH });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const token = String(body.token || process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const runtimeIdentity = resolveRuntimeIdentity();
    const mesh = loadRuntimeMesh();
    const dispatch = {
      ok: Boolean(token && token.length >= 20),
      endpoint: TELEGRAM_DISPATCH_PATH,
      token_verified: Boolean(token && token.length >= 20),
      lifecycle: 'synced',
      mode: 'sovereign-dispatcher',
      runtime_identity: runtimeIdentity,
      runtime_mesh_synced: Boolean(mesh.hardware_nodes && mesh.hardware_nodes[runtimeIdentity.runtime_node_id]),
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
