const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const DIST_DIR = path.join(__dirname, 'webapp', 'dist');
const sessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

function sendEmpty(res, status = 204) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  });
  res.end();
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => sendJson(res, 404, { error: 'not-found' }));
  res.writeHead(200, { 'Content-Type': type });
  stream.pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('body-too-large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('invalid-json'));
      }
    });
    req.on('error', reject);
  });
}

function generateCode() {
  let code = '';
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (sessions.has(code));
  return code;
}

function getSession(code) {
  const session = sessions.get(code);
  if (!session) return null;
  session.updatedAt = Date.now();
  return session;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [code, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) sessions.delete(code);
  }
}

function normalizeState(raw) {
  return raw && typeof raw === 'object' ? raw : {};
}

async function handleApi(req, res, pathname, urlObj) {
  if (req.method === 'OPTIONS') {
    sendEmpty(res, 204);
    return;
  }
  const parts = pathname.split('/').filter(Boolean);

  if (req.method === 'POST' && pathname === '/api/sessions') {
    const body = await readBody(req);
    const code = generateCode();
    sessions.set(code, {
      code,
      revision: 1,
      gameState: normalizeState(body.gameState),
      updatedAt: Date.now(),
    });
    sendJson(res, 200, { code, revision: 1 });
    return;
  }

  if (parts.length >= 3 && parts[0] === 'api' && parts[1] === 'sessions') {
    const code = parts[2];
    const session = getSession(code);
    if (!session) {
      sendJson(res, 404, { error: 'session-not-found' });
      return;
    }

    if (req.method === 'POST' && parts[3] === 'join') {
      sendJson(res, 200, { code, revision: session.revision, gameState: session.gameState });
      return;
    }

    if (req.method === 'GET' && parts.length === 3) {
      const revision = Number(urlObj.searchParams.get('revision') || 0);
      if (revision === session.revision) {
        sendEmpty(res, 204);
        return;
      }
      sendJson(res, 200, { code, revision: session.revision, gameState: session.gameState });
      return;
    }

    if (req.method === 'PUT' && parts[3] === 'state') {
      const body = await readBody(req);
      const force = Boolean(body.force);
      const revision = Number(body.revision || 0);
      if (!force && revision !== session.revision) {
        sendJson(res, 409, {
          error: 'revision-conflict',
          revision: session.revision,
          gameState: session.gameState,
        });
        return;
      }
      session.revision += 1;
      session.gameState = normalizeState(body.gameState);
      session.updatedAt = Date.now();
      sendJson(res, 200, { code, revision: session.revision });
      return;
    }
  }

  sendJson(res, 404, { error: 'not-found' });
}

function safeFilePath(urlPath) {
  const normalized = (urlPath === '/' ? '/index.html' : urlPath).replace(/^\/+/, '');
  const target = path.join(DIST_DIR, normalized);
  if (!target.startsWith(DIST_DIR)) return null;
  return target;
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (urlObj.pathname.startsWith('/api/')) {
      await handleApi(req, res, urlObj.pathname, urlObj);
      return;
    }

    let filePath = safeFilePath(urlObj.pathname);
    if (!filePath) {
      sendJson(res, 400, { error: 'bad-path' });
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      sendFile(res, filePath);
      return;
    }

    filePath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(filePath)) {
      sendFile(res, filePath);
      return;
    }

    sendJson(res, 404, { error: 'build-not-found' });
  } catch (error) {
    const message = error && error.message ? error.message : 'server-error';
    sendJson(res, 500, { error: message });
  }
});

setInterval(cleanupSessions, 60 * 60 * 1000).unref();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Catan sync server listening on http://0.0.0.0:${PORT}`);
});
