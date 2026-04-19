const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Cache-Control': 'no-store',
};

function json(data, status = 200) {
  const payload = data && typeof data === 'object' && !Array.isArray(data)
    ? { ...data, serverNow: Date.now() }
    : { value: data, serverNow: Date.now() };
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}

function empty(status = 204) {
  return new Response(null, { status, headers: corsHeaders });
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const DEVICE_TTL_MS = 20_000;

function normalizeDevices(devices) {
  const next = {};
  for (const [id, value] of Object.entries(devices || {})) {
    if (typeof value === 'number') {
      next[id] = { seenAt: value, label: null };
    } else if (value && typeof value === 'object') {
      next[id] = {
        seenAt: Number(value.seenAt || 0),
        label: value.label || null,
      };
    }
  }
  return next;
}

function pruneDevices(devices) {
  const now = Date.now();
  const next = {};
  for (const [id, value] of Object.entries(normalizeDevices(devices))) {
    if (now - value.seenAt < DEVICE_TTL_MS) next[id] = value;
  }
  return next;
}

async function roomExists(env, code) {
  const id = env.ROOMS.idFromName(code);
  const stub = env.ROOMS.get(id);
  const response = await stub.fetch('https://room/status');
  const data = await response.json();
  return data.exists === true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return empty();
    }

    if (url.pathname === '/api/sessions' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      for (let i = 0; i < 20; i += 1) {
        const code = randomCode();
        if (await roomExists(env, code)) continue;

        const id = env.ROOMS.idFromName(code);
        const stub = env.ROOMS.get(id);
        const initResponse = await stub.fetch('https://room/init', {
          method: 'POST',
          body: JSON.stringify({ gameState: body.gameState || {}, deviceId: body.deviceId }),
        });
        const data = await initResponse.json();
        return json({ code, revision: data.revision, participantCount: data.participantCount });
      }
      return json({ error: 'unable-to-create-session' }, 500);
    }

    if (url.pathname.startsWith('/api/sessions/')) {
      const [, , , code, action] = url.pathname.split('/');
      if (!code) return json({ error: 'missing-code' }, 400);
      const id = env.ROOMS.idFromName(code);
      const stub = env.ROOMS.get(id);

      if (!action && request.method === 'GET') {
        const revision = url.searchParams.get('revision') || '0';
        const deviceId = url.searchParams.get('deviceId') || '';
        return stub.fetch(`https://room/state?revision=${revision}&deviceId=${deviceId}`);
      }

      if (action === 'join' && request.method === 'POST') {
        return stub.fetch('https://room/join', { method: 'POST', body: await request.text() });
      }

      if (action === 'state' && request.method === 'PUT') {
        return stub.fetch('https://room/update', {
          method: 'PUT',
          body: await request.text(),
        });
      }

      return json({ error: 'not-found' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

export class GameRoom {
  constructor(state) {
    this.state = state;
  }

  async touchDevice(deviceId) {
    const devices = pruneDevices((await this.state.storage.get('devices')) || {});
    if (deviceId) {
      const current = devices[deviceId] || {};
      const labels = Object.values(devices).map(item => Number((item.label || '').replace(/\D/g, ''))).filter(Boolean);
      const nextLabelNumber = labels.length ? Math.max(...labels) + 1 : 1;
      devices[deviceId] = {
        seenAt: Date.now(),
        label: current.label || `Устр. ${nextLabelNumber}`,
      };
    }
    await this.state.storage.put('devices', devices);
    return {
      participantCount: Object.keys(devices).length,
      deviceLabels: Object.values(devices).map(item => item.label).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru')),
    };
  }

  async participantCount() {
    const devices = pruneDevices((await this.state.storage.get('devices')) || {});
    await this.state.storage.put('devices', devices);
    return {
      participantCount: Object.keys(devices).length,
      deviceLabels: Object.values(devices).map(item => item.label).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru')),
    };
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return empty();

    if (url.pathname === '/status') {
      const revision = await this.state.storage.get('revision');
      return json({ exists: typeof revision === 'number' });
    }

    if (url.pathname === '/init' && request.method === 'POST') {
      const currentRevision = await this.state.storage.get('revision');
      if (typeof currentRevision === 'number') {
        return json({ revision: currentRevision, ...(await this.participantCount()) });
      }

      const body = await request.json().catch(() => ({}));
      await this.state.storage.put('revision', 1);
      await this.state.storage.put('gameState', body.gameState || {});
      return json({ revision: 1, ...(await this.touchDevice(body.deviceId)) });
    }

    const revision = await this.state.storage.get('revision');
    const gameState = (await this.state.storage.get('gameState')) || {};
    if (typeof revision !== 'number') return json({ error: 'session-not-found' }, 404);

    if (url.pathname === '/join' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      return json({ revision, gameState, ...(await this.touchDevice(body.deviceId)) });
    }

    if (url.pathname === '/state' && request.method === 'GET') {
      const presence = await this.touchDevice(url.searchParams.get('deviceId') || '');
      const clientRevision = Number(url.searchParams.get('revision') || 0);
      if (clientRevision === revision) {
        return json({ revision, changed: false, ...presence });
      }
      return json({ revision, gameState, ...presence });
    }

    if (url.pathname === '/update' && request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const presence = await this.touchDevice(body.deviceId);
      const force = Boolean(body.force);
      const clientRevision = Number(body.revision || 0);

      if (!force && clientRevision !== revision) {
        return json({ error: 'revision-conflict', revision, gameState, ...presence }, 409);
      }

      const nextRevision = revision + 1;
      await this.state.storage.put('revision', nextRevision);
      await this.state.storage.put('gameState', body.gameState || {});
      return json({ revision: nextRevision, ...presence });
    }

    return json({ error: 'not-found' }, 404);
  }
}
