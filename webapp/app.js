'use strict';

const EVENT_DEFS = {
  trade: {
    key: 'trade',
    name: 'Торговля',
    sub: 'Ткань (Шерсть)',
    color: '#E8C97A',
    imgBase: 'Yellow',
  },
  politics: {
    key: 'politics',
    name: 'Политика',
    sub: 'Монеты (Руда)',
    color: '#7A9FE8',
    imgBase: 'Blue',
  },
  science: {
    key: 'science',
    name: 'Учёность',
    sub: 'Бумага (Дерево)',
    color: '#7AE8A3',
    imgBase: 'Green',
  },
  barbarians: {
    key: 'barbarians',
    name: 'Варвары!',
    sub: '',
    color: '#E87A7A',
    imgBase: null,
  },
};

const EVENT_POOL = ['trade', 'politics', 'science', 'barbarians', 'barbarians', 'barbarians'];

const EVENT_THEORY = {
  trade: 16.7,
  politics: 16.7,
  science: 16.7,
  barbarians: 50,
};

const DOT_POS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

const THEORY = {
  2: 2.78, 3: 5.56, 4: 8.33, 5: 11.11, 6: 13.89,
  7: 16.67, 8: 13.89, 9: 11.11, 10: 8.33, 11: 5.56, 12: 2.78,
};

const EV_COLORS_DARK = {
  trade: '#E8C97A',
  politics: '#7A9FE8',
  science: '#7AE8A3',
  barbarians: '#E87A7A',
};

const EV_COLORS_LIGHT = {
  trade: '#9A6D08',
  politics: '#1A4898',
  science: '#156830',
  barbarians: '#AA2020',
};

const EVENT_UI_COLORS_LIGHT = {
  trade: '#6B4700',
  politics: '#10356F',
  science: '#0E4C24',
  barbarians: '#7D1111',
};

const DICE_SIZE = (() => {
  const w = Math.min(window.innerWidth, 520) - 24;
  const side = Math.min(124, Math.max(78, Math.floor(w * 0.24)));
  return side;
})();

const state = {
  locked: false,
  turns: [],
  rollMode: 'random',
  exhaustDeck: [],
  exhaustIdx: 0,
  eventMode: 'random',
  eventDeck: [],
  eventIdx: 0,
  timeLimit: 0,
  barbarianTracking: true,
  barbarianPosition: 0,
  lastEventView: null,
  timerSecs: 0,
  timerRunning: false,
  timerPaused: false,
  timerStarted: false,
  timerIval: null,
  alarmActive: false,
  timerSyncedAt: 0,
  timerDeadlineMs: 0,
  timerStartedAtMs: 0,
  alchemyDie1: 1,
  alchemyDie2: 1,
  deviceId: crypto.randomUUID ? crypto.randomUUID() : `device-${Math.random().toString(16).slice(2)}`,
  syncCode: '',
  syncConnected: false,
  syncPollIval: null,
  syncRevision: 0,
  syncBusy: false,
  syncParticipantCount: 0,
  syncDeviceLabels: [],
  simultaneousMode: true,
  pendingCue: null,
  cueTimeout: null,
  lastAnimatedTurnId: '',
  clockOffsetMs: 0,
};

function defaultSyncBase() {
  return window.location.protocol.startsWith('http') ? `${window.location.origin}/api` : '';
}

function getApiBase() {
  return defaultSyncBase();
}

function imageUrl(name) {
  return new URL(`images/${name}`, document.baseURI).href;
}

function showToast(message) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = message;
  stack.appendChild(item);
  setTimeout(() => item.remove(), 2400);
}

function isDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function evTableColor(key) {
  return isDark() ? EV_COLORS_DARK[key] : EV_COLORS_LIGHT[key];
}

function eventUiColor(key, fallback) {
  if (isDark()) return fallback;
  return EVENT_UI_COLORS_LIGHT[key] || fallback;
}

function DIE_WHITE() {
  return isDark() ? '#EEEEFF' : '#1A180E';
}

const DIE_RED = '#E87A7A';

function dieTheme() {
  return isDark()
    ? { face: '#1A1A2E', shadow: '#050510' }
    : { face: '#E8E4D8', shadow: '#A09A88' };
}

function chartPalette() {
  return isDark()
    ? { bar: '#7A9FE8', theory: '#E87A7A', label: '#EEEEFF', dim: '#5A5A7A', base: '#2A2A40' }
    : { bar: '#1A4898', theory: '#AA2020', label: '#1A180E', dim: '#7A7260', base: '#C8C2AC' };
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function rnd6() {
  return Math.ceil(Math.random() * 6);
}

function buildDiceDeck() {
  return shuffle(Array.from({ length: 36 }, (_, i) => [Math.floor(i / 6) + 1, (i % 6) + 1]));
}

function buildEventDeck() {
  return shuffle(EVENT_POOL);
}

function getNextDice(useAlchemist = false, alchemyDice = null) {
  if (useAlchemist && alchemyDice) return [...alchemyDice];
  if (state.rollMode === 'random') return [rnd6(), rnd6()];
  if (state.exhaustIdx >= state.exhaustDeck.length) {
    state.exhaustDeck = buildDiceDeck();
    state.exhaustIdx = 0;
  }
  return state.exhaustDeck[state.exhaustIdx++];
}

function getNextEvent() {
  if (state.eventMode === 'random') {
    return EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  }
  if (state.eventIdx >= state.eventDeck.length) {
    state.eventDeck = buildEventDeck();
    state.eventIdx = 0;
  }
  return state.eventDeck[state.eventIdx++];
}

function formatTime(secs) {
  if (secs >= 60) return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  return String(secs);
}

function syncedNow() {
  return Date.now() + state.clockOffsetMs;
}

function updateServerClockOffset(serverNow, requestStartedAt, responseReceivedAt) {
  if (!Number.isFinite(serverNow)) return;
  const midpoint = Number.isFinite(requestStartedAt) && Number.isFinite(responseReceivedAt)
    ? requestStartedAt + ((responseReceivedAt - requestStartedAt) / 2)
    : Date.now();
  state.clockOffsetMs = Math.round(serverNow - midpoint);
}

function syncLiveTimerState() {
  if (!state.timerStarted || state.alarmActive) return state.timerSecs;
  if (!state.timerRunning) return state.timerSecs;

  if (state.timeLimit > 0 && state.timerDeadlineMs) {
    state.timerSecs = Math.max(0, Math.ceil((state.timerDeadlineMs - syncedNow()) / 1000));
  } else if (state.timerStartedAtMs) {
    state.timerSecs = Math.max(0, Math.floor((syncedNow() - state.timerStartedAtMs) / 1000));
  }
  return state.timerSecs;
}

function currentTurnElapsed() {
  if (!state.timerStarted && !state.alarmActive) return null;
  syncLiveTimerState();
  return state.timeLimit > 0 ? state.timeLimit - state.timerSecs : state.timerSecs;
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-value');
  if (!state.timerStarted && !state.alarmActive) {
    el.textContent = '—';
    return;
  }
  syncLiveTimerState();
  el.textContent = state.timeLimit > 0 ? formatTime(state.timerSecs) : `${state.timerSecs}с`;
}

function setTimerStyle() {
  const display = document.getElementById('timer-display');
  display.classList.remove('warning', 'danger', 'alarm');
  if (state.alarmActive) {
    display.classList.add('alarm');
    return;
  }
  if (state.timeLimit > 0 && (state.timerRunning || state.timerPaused)) {
    const pct = state.timeLimit === 0 ? 1 : state.timerSecs / state.timeLimit;
    if (pct < 0.25) display.classList.add('danger');
    else if (pct < 0.5) display.classList.add('warning');
  }
}

function clearTimerInterval() {
  if (state.timerIval) {
    clearInterval(state.timerIval);
    state.timerIval = null;
  }
}

function triggerAlarm() {
  clearTimerInterval();
  state.timerRunning = false;
  state.timerPaused = false;
  state.alarmActive = true;
  state.timerStarted = true;
  state.timerSyncedAt = syncedNow();
  state.timerDeadlineMs = 0;
  state.timerStartedAtMs = 0;
  updateTimerDisplay();
  setTimerStyle();
  document.getElementById('roll-btn').classList.add('alarm');
  if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
  pushStateToSync().catch(() => {});
}

function runTimerTick() {
  clearTimerInterval();
  state.timerIval = setInterval(() => {
    syncLiveTimerState();
    if (state.timeLimit > 0) {
      if (state.timerSecs <= 0) {
        state.timerSecs = 0;
        updateTimerDisplay();
        triggerAlarm();
        return;
      }
    }
    updateTimerDisplay();
    setTimerStyle();
  }, 250);
}

function startTimer(reset = true) {
  startTimerAt(0, reset);
}

function startTimerAt(anchorMs = 0, reset = true) {
  clearTimerInterval();
  state.alarmActive = false;
  document.getElementById('roll-btn').classList.remove('alarm');
  if (reset || !state.timerStarted) {
    state.timerSecs = state.timeLimit > 0 ? state.timeLimit : 0;
  }
  state.timerStarted = true;
  state.timerPaused = false;
  state.timerRunning = true;
  state.timerSyncedAt = syncedNow();
  const baseTime = anchorMs || syncedNow();
  if (state.timeLimit > 0) {
    state.timerDeadlineMs = baseTime + state.timerSecs * 1000;
    state.timerStartedAtMs = 0;
  } else {
    state.timerStartedAtMs = baseTime - state.timerSecs * 1000;
    state.timerDeadlineMs = 0;
  }
  updateTimerDisplay();
  setTimerStyle();
  runTimerTick();
  pushStateToSync().catch(() => {});
}

function pauseTimer() {
  if (!state.timerRunning || state.alarmActive) return;
  if (state.timeLimit > 0 && state.timerDeadlineMs) {
    state.timerSecs = Math.max(0, Math.ceil((state.timerDeadlineMs - syncedNow()) / 1000));
  } else if (state.timerStartedAtMs) {
    state.timerSecs = Math.max(0, Math.floor((syncedNow() - state.timerStartedAtMs) / 1000));
  }
  clearTimerInterval();
  state.timerRunning = false;
  state.timerPaused = true;
  state.timerSyncedAt = syncedNow();
  state.timerDeadlineMs = 0;
  state.timerStartedAtMs = 0;
  setTimerStyle();
  pushStateToSync().catch(() => {});
}

function resumeTimer() {
  if (state.locked || state.alarmActive) return;
  if (!state.timerStarted) {
    startTimer(true);
    return;
  }
  if (!state.timerPaused) return;
  state.timerRunning = true;
  state.timerPaused = false;
  state.timerSyncedAt = syncedNow();
  if (state.timeLimit > 0) {
    state.timerDeadlineMs = syncedNow() + state.timerSecs * 1000;
    state.timerStartedAtMs = 0;
  } else {
    state.timerStartedAtMs = syncedNow() - state.timerSecs * 1000;
    state.timerDeadlineMs = 0;
  }
  setTimerStyle();
  runTimerTick();
  pushStateToSync().catch(() => {});
}

function finishTurnTimer() {
  const elapsed = currentTurnElapsed();
  clearTimerInterval();
  state.timerRunning = false;
  state.timerPaused = false;
  state.timerStarted = false;
  state.alarmActive = false;
  state.timerSyncedAt = syncedNow();
  state.timerDeadlineMs = 0;
  state.timerStartedAtMs = 0;
  document.getElementById('timer-display').classList.remove('warning', 'danger', 'alarm');
  document.getElementById('roll-btn').classList.remove('alarm');
  updateTimerDisplay();
  return elapsed;
}

function setRollMode(mode) {
  state.rollMode = mode;
  state.exhaustDeck = [];
  state.exhaustIdx = 0;
  refreshSettingsUI();
  renderCounters();
  pushStateToSync().catch(() => {});
}

function setEventMode(mode) {
  state.eventMode = mode;
  state.eventDeck = [];
  state.eventIdx = 0;
  refreshSettingsUI();
  renderCounters();
  pushStateToSync().catch(() => {});
}

function setTimeLimit(secs) {
  state.timeLimit = Math.max(0, secs || 0);
  finishTurnTimer();
  refreshSettingsUI();
  pushStateToSync().catch(() => {});
}

function setBarbarianTracking(enabled) {
  state.barbarianTracking = enabled;
  refreshSettingsUI();
  renderHistory();
  if (!state.turns.length) {
    renderStartEventState();
  } else {
    state.lastEventView = makeEventView(state.turns[state.turns.length - 1]);
    renderEventState(state.lastEventView);
  }
  pushStateToSync().catch(() => {});
}

function setSimultaneousMode(enabled) {
  state.simultaneousMode = enabled;
  refreshSettingsUI();
  pushStateToSync().catch(() => {});
}

function setBarbarianPosition(position) {
  state.barbarianPosition = position;
  renderHistory();
  if (!state.turns.length) {
    renderStartEventState();
  } else if (state.lastEventView && state.lastEventView.eventKey === 'barbarians' && state.barbarianTracking) {
    state.lastEventView.image = imageUrl(`barbarians${position}.png`);
    renderEventState(state.lastEventView);
  }
  renderHistoryModal();
  pushStateToSync().catch(() => {});
}

function openModal(id) {
  document.getElementById(id).classList.remove('modal-hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('modal-hidden');
}

function sanitizeJoinCode(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

function syncAvailable() {
  return Boolean(getApiBase());
}

function syncStatusText() {
  if (!syncAvailable()) return 'Синхронизация недоступна';
  if (!state.syncConnected) return 'Не подключено';
  return `Код игры: ${state.syncCode}`;
}

function renderSyncUI() {
  const status = document.getElementById('sync-status');
  if (status) status.textContent = syncStatusText();
  const leaveBtn = document.getElementById('leave-sync-btn');
  if (leaveBtn) leaveBtn.disabled = !state.syncConnected;
  const codeEl = document.getElementById('game-code');
  if (codeEl) codeEl.textContent = state.syncCode || '------';
  const banner = document.getElementById('sync-banner');
  if (banner) {
    banner.textContent = `Устр.: ${state.syncParticipantCount}`;
  }
}

function updateSyncPresence(count, labels = []) {
  const prev = state.syncParticipantCount;
  state.syncParticipantCount = Number(count || 0);
  state.syncDeviceLabels = Array.isArray(labels) ? labels : [];
  if (state.syncConnected && prev > 0 && prev !== state.syncParticipantCount) {
    showToast(`Устройств в игре: ${state.syncParticipantCount}`);
  }
  renderSyncUI();
}

async function ensureAutoSession() {
  if (state.syncConnected) return;
  try {
    await createSyncSession();
  } catch (error) {
    renderSyncUI();
  }
}

function scheduleCueIfNeeded() {
  if (!state.pendingCue || state.pendingCue.type !== 'roll') return false;
  const cue = state.pendingCue;
  const lastTurn = state.turns[state.turns.length - 1];
  if (!lastTurn || cue.turnId !== lastTurn.id) return false;
  if (state.lastAnimatedTurnId === lastTurn.id) return false;

  const delay = cue.executeAt - syncedNow();
  if (delay <= 0) {
    if (delay > -1800) {
      document.getElementById('roll-btn').disabled = true;
      state.locked = true;
      setTimeout(() => playTurnAnimation(lastTurn), 0);
      return true;
    }
    return false;
  }

  const previousTurn = state.turns.length > 1 ? state.turns[state.turns.length - 2] : null;
  if (previousTurn) renderEventState(makeEventView(previousTurn));
  else renderStartEventState();

  document.getElementById('roll-btn').disabled = true;
  state.locked = true;
  state.cueTimeout = setTimeout(() => {
    state.cueTimeout = null;
    playTurnAnimation(lastTurn);
  }, delay);
  return true;
}

function serializeState() {
  return {
    turns: state.turns,
    rollMode: state.rollMode,
    exhaustDeck: state.exhaustDeck,
    exhaustIdx: state.exhaustIdx,
    eventMode: state.eventMode,
    eventDeck: state.eventDeck,
    eventIdx: state.eventIdx,
    timeLimit: state.timeLimit,
    barbarianTracking: state.barbarianTracking,
    barbarianPosition: state.barbarianPosition,
    timerSecs: state.timerSecs,
    timerRunning: state.timerRunning,
    timerPaused: state.timerPaused,
    timerStarted: state.timerStarted,
    alarmActive: state.alarmActive,
    timerSyncedAt: state.timerSyncedAt || syncedNow(),
    timerDeadlineMs: state.timerDeadlineMs || 0,
    timerStartedAtMs: state.timerStartedAtMs || 0,
    alchemyDie1: state.alchemyDie1,
    alchemyDie2: state.alchemyDie2,
    simultaneousMode: state.simultaneousMode,
    pendingCue: state.pendingCue,
  };
}

function normalizeRemoteTimer(gameState) {
  if (!gameState.timerStarted || gameState.alarmActive || gameState.timerPaused) return gameState;

  if (gameState.timerRunning) {
    if (gameState.timeLimit > 0 && gameState.timerDeadlineMs) {
      gameState.timerSecs = Math.max(0, Math.ceil((Number(gameState.timerDeadlineMs) - syncedNow()) / 1000));
      if (gameState.timerSecs <= 0) {
        gameState.timerSecs = 0;
        gameState.timerRunning = false;
        gameState.alarmActive = true;
      }
    } else if (gameState.timerStartedAtMs) {
      gameState.timerSecs = Math.max(0, Math.floor((syncedNow() - Number(gameState.timerStartedAtMs)) / 1000));
    }
    gameState.timerSyncedAt = syncedNow();
  }
  return gameState;
}

function hydrateState(gameState) {
  const incoming = normalizeRemoteTimer(typeof structuredClone === 'function'
    ? structuredClone(gameState)
    : JSON.parse(JSON.stringify(gameState)));
  clearTimerInterval();
  if (state.cueTimeout) {
    clearTimeout(state.cueTimeout);
    state.cueTimeout = null;
  }

  state.turns = incoming.turns || [];
  state.rollMode = incoming.rollMode || 'random';
  state.exhaustDeck = incoming.exhaustDeck || [];
  state.exhaustIdx = incoming.exhaustIdx || 0;
  state.eventMode = incoming.eventMode || 'random';
  state.eventDeck = incoming.eventDeck || [];
  state.eventIdx = incoming.eventIdx || 0;
  state.timeLimit = incoming.timeLimit || 0;
  state.barbarianTracking = incoming.barbarianTracking !== false;
  state.barbarianPosition = incoming.barbarianPosition || 0;
  state.timerSecs = incoming.timerSecs || 0;
  state.timerRunning = Boolean(incoming.timerRunning);
  state.timerPaused = Boolean(incoming.timerPaused);
  state.timerStarted = Boolean(incoming.timerStarted);
  state.alarmActive = Boolean(incoming.alarmActive);
  state.timerSyncedAt = incoming.timerSyncedAt || syncedNow();
  state.timerDeadlineMs = incoming.timerDeadlineMs || 0;
  state.timerStartedAtMs = incoming.timerStartedAtMs || 0;
  state.alchemyDie1 = incoming.alchemyDie1 || 1;
  state.alchemyDie2 = incoming.alchemyDie2 || 1;
  state.simultaneousMode = Boolean(incoming.simultaneousMode);
  state.pendingCue = incoming.pendingCue || null;
  state.locked = false;
  state.lastAnimatedTurnId = state.lastAnimatedTurnId || '';

  state.lastEventView = state.turns.length ? makeEventView(state.turns[state.turns.length - 1]) : null;
  if (state.lastEventView) {
    const lastTurn = state.turns[state.turns.length - 1];
    renderDie(document.getElementById('die1'), lastTurn.d1, DIE_WHITE(), false);
    renderDie(document.getElementById('die2'), lastTurn.d2, DIE_RED, true);
    if (!scheduleCueIfNeeded()) {
      renderEventState(state.lastEventView);
    }
    renderCounters(lastTurn);
  } else {
    renderDie(document.getElementById('die1'), 1, DIE_WHITE(), false);
    renderDie(document.getElementById('die2'), 1, DIE_RED, true);
    renderStartEventState();
    renderCounters();
  }

  renderRollCount();
  renderHistory();
  refreshSettingsUI();
  updateTimerDisplay();
  setTimerStyle();

  if (state.timerRunning && !state.alarmActive) {
    runTimerTick();
  }
  if (!document.getElementById('history-modal').classList.contains('modal-hidden')) renderHistoryModal();
  if (!document.getElementById('stats-modal').classList.contains('modal-hidden')) renderStats();
}

async function apiFetch(path, options = {}) {
  if (!syncAvailable()) throw new Error('sync-unavailable');
  const requestStartedAt = Date.now();
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const responseReceivedAt = Date.now();
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (typeof data.serverNow === 'number') {
    updateServerClockOffset(data.serverNow, requestStartedAt, responseReceivedAt);
  }
  if (!response.ok) throw new Error(data.error || 'sync-error');
  return data;
}

async function pushStateToSync(force = false) {
  if (!state.syncConnected || !state.syncCode || state.syncBusy) return;
  state.syncBusy = true;
  try {
    const payload = {
      deviceId: state.deviceId,
      revision: state.syncRevision,
      gameState: serializeState(),
      force,
    };
    const data = await apiFetch(`/sessions/${state.syncCode}/state`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    state.syncRevision = data.revision;
    updateSyncPresence(data.participantCount, data.deviceLabels);
  } catch (error) {
    if (String(error.message) === 'revision-conflict') {
      await pullStateFromSync();
    }
  } finally {
    state.syncBusy = false;
  }
}

async function pullStateFromSync() {
  if (!state.syncConnected || !state.syncCode) return;
  const data = await apiFetch(`/sessions/${state.syncCode}?revision=${state.syncRevision}&deviceId=${encodeURIComponent(state.deviceId)}`);
  if (!data) return;
  if (typeof data.revision === 'number' && data.revision >= state.syncRevision) {
    state.syncRevision = data.revision;
    if (data.gameState) hydrateState(data.gameState);
    updateSyncPresence(data.participantCount, data.deviceLabels);
  }
}

function startSyncPolling() {
  stopSyncPolling();
  pullStateFromSync().catch(() => {});
  state.syncPollIval = setInterval(() => {
    pullStateFromSync().catch(() => {});
  }, 350);
}

function stopSyncPolling() {
  if (state.syncPollIval) {
    clearInterval(state.syncPollIval);
    state.syncPollIval = null;
  }
}

async function createSyncSession() {
  const data = await apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({ deviceId: state.deviceId, gameState: serializeState() }),
  });
  state.syncCode = data.code;
  state.syncRevision = data.revision;
  state.syncConnected = true;
  updateSyncPresence(data.participantCount, data.deviceLabels);
  startSyncPolling();
  showToast(`Код игры создан: ${data.code}`);
  document.getElementById('join-code-input').value = data.code;
}

async function joinSyncSession(code) {
  const normalized = sanitizeJoinCode(code);
  if (normalized.length !== 6) return;
  const data = await apiFetch(`/sessions/${normalized}/join`, {
    method: 'POST',
    body: JSON.stringify({ deviceId: state.deviceId }),
  });
  state.syncCode = normalized;
  state.syncRevision = data.revision;
  state.syncConnected = true;
  if (data.gameState) hydrateState(data.gameState);
  updateSyncPresence(data.participantCount, data.deviceLabels);
  startSyncPolling();
  showToast(`Устройство подключено к игре ${normalized}`);
  document.getElementById('join-code-input').value = normalized;
}

function leaveSyncSession() {
  stopSyncPolling();
  state.syncCode = '';
  state.syncRevision = 0;
  state.syncConnected = false;
  state.syncParticipantCount = 0;
  state.syncDeviceLabels = [];
  document.getElementById('join-code-input').value = '';
  renderSyncUI();
  showToast('Синхронизация отключена');
}

function drawChoiceGrid(containerId, selectedValue, onClick) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const btn = document.createElement('button');
    btn.className = 'position-chip';
    btn.textContent = String(i);
    btn.classList.toggle('selected', i === selectedValue);
    btn.addEventListener('click', () => onClick(i));
    container.appendChild(btn);
  }
}

function renderBarbarianPositionGrid() {
  const container = document.getElementById('barbarian-position-options');
  container.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const btn = document.createElement('button');
    btn.className = 'position-chip';
    btn.textContent = String(i);
    btn.classList.toggle('selected', i === state.barbarianPosition);
    btn.addEventListener('click', () => setBarbarianPosition(i));
    container.appendChild(btn);
  }
}

function turnDescription(turn) {
  const event = EVENT_DEFS[turn.eventKey];
  const label = turn.alchemist ? 'Алхимик' : `#${turn.number}`;
  const counted = turn.counted ? '' : ' • без статистики';
  const think = turn.elapsed !== null ? ` • ${turn.elapsed}с` : '';
  const barb = turn.barbarianPositionAfter > 0 && state.barbarianTracking
    ? ` • варвары ${turn.barbarianPositionAfter}`
    : '';
  return `${label} • ${event.name} • ${turn.d1}+${turn.d2}=${turn.total}${think}${counted}${barb}`;
}

function renderHistory() {
  const recentTurnsEl = document.getElementById('recent-turns');
  const recent = [...state.turns].slice(-3).reverse();
  recentTurnsEl.innerHTML = recent.length
    ? recent.map(turn => {
      const event = EVENT_DEFS[turn.eventKey];
      const eventLabel = turn.eventKey === 'barbarians'
        ? 'Варв'
        : `${event.name.slice(0, 4)} (${turn.d2})`;
      return `<div class="recent-turn-chip">
        <div class="recent-turn-top">#${turn.number} ${turn.d1}+${turn.d2}</div>
        <div class="recent-turn-bottom">${eventLabel}</div>
      </div>`;
    }).join('')
    : '<div class="no-data">Нет ходов</div>';
  const barbMeta = state.barbarianTracking
    ? `Варвары: ${state.barbarianPosition === 0 ? 'старт' : state.barbarianPosition}`
    : 'Варвары: выкл';
  document.getElementById('history-meta').textContent = barbMeta;
}

function renderHistoryModal() {
  renderBarbarianPositionGrid();
  const fullHistory = document.getElementById('full-history');
  if (state.turns.length === 0) {
    fullHistory.innerHTML = '<div class="no-data">Пока нет ходов</div>';
    return;
  }
  fullHistory.innerHTML = [...state.turns]
    .reverse()
    .map(turn => `<div class="full-history-item ${turn.counted ? '' : 'dimmed'}">${turnDescription(turn)}</div>`)
    .join('');
}

function renderRollCount() {
  document.getElementById('roll-count').textContent = `Ходов: ${state.turns.length}`;
}

function renderCounters(lastTurn = null) {
  const headerParts = [];
  if (state.rollMode === 'exhaust') headerParts.push(`Кубики ${state.exhaustIdx}/36`);
  if (state.eventMode === 'exhaust') headerParts.push(`События ${state.eventIdx}/6`);
  document.getElementById('deck-counter').innerHTML = headerParts.length ? headerParts.join(' · ') : '&nbsp;';
}

function makeEventView(turn) {
  const event = EVENT_DEFS[turn.eventKey];
  const isBarbarians = turn.eventKey === 'barbarians';
  let img = '';
  if (isBarbarians) {
    if (state.barbarianTracking) {
      img = imageUrl(`barbarians${turn.barbarianPositionAfter}.png`);
    } else {
      img = imageUrl('barbarians.svg');
    }
  } else {
    img = imageUrl(`${event.imgBase}${turn.d2}.png`);
  }

  return {
    eventKey: turn.eventKey,
    name: isBarbarians ? 'Варвары!' : `${event.name} (${turn.d2})`,
    sub: event.sub || '\u00A0',
    color: event.color,
    image: img,
    barbarianImage: isBarbarians && state.barbarianTracking ? img : '',
    total: turn.total,
  };
}

function renderEventState(view) {
  const imgEl = document.getElementById('event-img');
  const subEl = document.getElementById('event-sub');
  const uiColor = eventUiColor(view.eventKey, view.color);
  document.getElementById('event-name').textContent = view.name;
  subEl.textContent = view.sub;
  document.getElementById('event-name').style.color = uiColor;
  subEl.style.color = uiColor;
  subEl.classList.toggle('blank-sub', !view.sub || view.sub === '\u00A0');
  imgEl.src = view.image;
  imgEl.classList.add('shown');
  document.getElementById('event-placeholder').classList.add('hidden');

  const section = document.getElementById('event-section');
  section.style.borderColor = view.color;
  section.style.boxShadow = `0 0 20px ${view.color}33`;
  document.getElementById('event-caption').style.borderTopColor = view.color;
  document.getElementById('sum-value').textContent = String(view.total);
  document.getElementById('sum-value').style.color = view.color;
  document.getElementById('sum-block').style.borderColor = view.color;
}

function renderStartEventState() {
  const imgEl = document.getElementById('event-img');
  if (state.barbarianTracking) {
    const uiColor = eventUiColor('barbarians', EVENT_DEFS.barbarians.color);
    imgEl.src = state.barbarianPosition > 0
      ? imageUrl(`barbarians${state.barbarianPosition}.png`)
      : imageUrl('barbarians1_start.png');
    imgEl.classList.add('shown');
    document.getElementById('event-placeholder').classList.add('hidden');
    document.getElementById('event-name').textContent = 'Варвары';
    document.getElementById('event-sub').textContent = state.barbarianPosition > 0 ? `Позиция: ${state.barbarianPosition}` : 'Стартовое положение';
    document.getElementById('event-name').style.color = uiColor;
    document.getElementById('event-sub').style.color = uiColor;
    document.getElementById('event-section').style.borderColor = EVENT_DEFS.barbarians.color;
    document.getElementById('event-section').style.boxShadow = `0 0 20px ${EVENT_DEFS.barbarians.color}33`;
    document.getElementById('event-caption').style.borderTopColor = EVENT_DEFS.barbarians.color;
  } else {
    imgEl.removeAttribute('src');
    imgEl.classList.remove('shown');
    document.getElementById('event-placeholder').classList.remove('hidden');
    document.getElementById('event-name').textContent = 'Нажмите кнопку';
    document.getElementById('event-sub').textContent = 'чтобы начать';
    document.getElementById('event-name').style.color = EVENT_DEFS.trade.color;
    document.getElementById('event-sub').style.color = '';
    document.getElementById('event-section').style.borderColor = 'var(--border)';
    document.getElementById('event-section').style.boxShadow = 'none';
    document.getElementById('event-caption').style.borderTopColor = 'var(--border)';
  }
  document.getElementById('sum-value').textContent = '—';
  document.getElementById('sum-block').style.borderColor = 'var(--border)';
}

function createTurn({ eventKey, d1, d2, elapsed, alchemist }) {
  const total = d1 + d2;
  let barbarianPositionAfter = state.barbarianPosition;
  if (eventKey === 'barbarians' && state.barbarianTracking) {
    barbarianPositionAfter = state.barbarianPosition === 0
      ? 2
      : (state.barbarianPosition % 7) + 1;
    state.barbarianPosition = barbarianPositionAfter;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    number: state.turns.length + 1,
    eventKey,
    d1,
    d2,
    total,
    elapsed,
    alchemist,
    counted: !alchemist,
    usedDiceDeck: state.rollMode === 'exhaust' && !alchemist,
    usedEventDeck: state.eventMode === 'exhaust',
    barbarianPositionAfter,
  };
}

function rerenderAfterStateChange(lastTurn = null, skipSync = false) {
  renderRollCount();
  renderHistory();
  renderCounters(lastTurn);
  refreshSettingsUI();
  if (document.getElementById('stats-modal') && !document.getElementById('stats-modal').classList.contains('modal-hidden')) {
    renderStats();
  }
  if (!document.getElementById('history-modal').classList.contains('modal-hidden')) {
    renderHistoryModal();
  }
  renderSyncUI();
  if (!skipSync) pushStateToSync().catch(() => {});
}

function playTurnAnimation(turn) {
  state.lastAnimatedTurnId = turn.id;
  const view = makeEventView(turn);
  state.lastEventView = view;
  const activeCue = state.pendingCue && state.pendingCue.turnId === turn.id ? state.pendingCue : null;

  animateDie(document.getElementById('die1'), turn.d1, DIE_WHITE(), false);
  animateDie(document.getElementById('die2'), turn.d2, DIE_RED, true);

  setTimeout(() => {
    renderEventState(view);
    rerenderAfterStateChange(turn);
    document.getElementById('roll-btn').disabled = false;
    state.locked = false;
    if (state.pendingCue && state.pendingCue.turnId === turn.id) {
      if (state.pendingCue.owner === state.deviceId) {
        state.pendingCue = null;
        pushStateToSync(true).catch(() => {});
      } else {
        state.pendingCue = null;
      }
    }
    setTimeout(() => {
      if (activeCue && activeCue.timerStartAt) startTimerAt(activeCue.timerStartAt, true);
      else startTimer(true);
    }, 80);
  }, 660);
}

function applyTurn(turn) {
  state.turns.push(turn);
  playTurnAnimation(turn);
}

function roll(options = {}) {
  if (state.locked) return;
  state.locked = true;
  document.getElementById('roll-btn').disabled = true;

  const elapsed = finishTurnTimer();
  const useAlchemist = Boolean(options.alchemist);
  const eventKey = getNextEvent();
  const [d1, d2] = getNextDice(useAlchemist, options.alchemyDice || null);
  const turn = createTurn({ eventKey, d1, d2, elapsed, alchemist: useAlchemist });

  if (state.syncConnected && state.simultaneousMode && state.syncParticipantCount > 1) {
    const executeAt = syncedNow() + 1500;
    state.turns.push(turn);
    state.pendingCue = {
      id: `${turn.id}-cue`,
      type: 'roll',
      turnId: turn.id,
      executeAt,
      timerStartAt: executeAt + 740,
      owner: state.deviceId,
    };
    pushStateToSync(true).catch(() => {});
    scheduleCueIfNeeded();
    return;
  }

  applyTurn(turn);
}

function recomputeBarbarianPosition() {
  let position = 0;
  for (const turn of state.turns) {
    if (turn.eventKey === 'barbarians' && state.barbarianTracking) {
      position = turn.barbarianPositionAfter;
    }
  }
  state.barbarianPosition = position;
}

function undoLastTurn() {
  if (state.turns.length === 0 || state.locked) return;
  const removed = state.turns.pop();
  if (removed.usedDiceDeck && state.exhaustIdx > 0) state.exhaustIdx -= 1;
  if (removed.usedEventDeck && state.eventIdx > 0) state.eventIdx -= 1;
  recomputeBarbarianPosition();
  state.lastEventView = state.turns.length ? makeEventView(state.turns[state.turns.length - 1]) : null;

  if (state.lastEventView) renderEventState(state.lastEventView);
  else renderStartEventState();

  rerenderAfterStateChange(state.turns[state.turns.length - 1] || null);
}

function resetGame() {
  state.turns = [];
  state.exhaustDeck = [];
  state.exhaustIdx = 0;
  state.eventDeck = [];
  state.eventIdx = 0;
  state.barbarianPosition = 0;
  state.lastEventView = null;
  finishTurnTimer();
  renderDie(document.getElementById('die1'), 1, DIE_WHITE(), false);
  renderDie(document.getElementById('die2'), 1, DIE_RED, true);
  renderStartEventState();
  rerenderAfterStateChange(null);
}

function refreshSettingsUI() {
  document.getElementById('mode-random').classList.toggle('selected', state.rollMode === 'random');
  document.getElementById('mode-exhaust').classList.toggle('selected', state.rollMode === 'exhaust');
  document.getElementById('event-mode-random').classList.toggle('selected', state.eventMode === 'random');
  document.getElementById('event-mode-exhaust').classList.toggle('selected', state.eventMode === 'exhaust');
  document.getElementById('barbarian-toggle').checked = state.barbarianTracking;
  document.getElementById('simultaneous-toggle').checked = state.simultaneousMode;
  document.querySelectorAll('.time-chip').forEach(btn => {
    btn.classList.toggle('selected', Number(btn.dataset.t) === state.timeLimit);
  });
  document.getElementById('custom-time-input').value = state.timeLimit > 0 && ![15, 30, 45, 60, 90].includes(state.timeLimit)
    ? String(state.timeLimit)
    : '';
}

function getCountedTurns() {
  return state.turns.filter(turn => turn.counted);
}

function countedEvents() {
  return getCountedTurns().reduce((acc, turn) => {
    acc[turn.eventKey] += 1;
    return acc;
  }, { trade: 0, politics: 0, science: 0, barbarians: 0 });
}

function renderStats() {
  const body = document.getElementById('stats-body');
  const countedTurns = getCountedTurns();
  const n = countedTurns.length;
  if (n === 0) {
    body.innerHTML = '<div class="no-data">Нет данных по статистике</div>';
    return;
  }

  const currentElapsed = currentTurnElapsed() || 0;
  const totalThink = countedTurns.reduce((sum, turn) => sum + (turn.elapsed || 0), 0) + currentElapsed;
  const sums = countedTurns.map(turn => turn.total);
  const avg = sums.reduce((a, b) => a + b, 0) / n;
  const diff = avg - 7;
  const sign = diff >= 0 ? '+' : '';
  const diffCol = isDark()
    ? (Math.abs(diff) < 0.5 ? '#7AE8A3' : (Math.abs(diff) < 1.5 ? '#E8C97A' : '#E87A7A'))
    : (Math.abs(diff) < 0.5 ? '#156830' : (Math.abs(diff) < 1.5 ? '#9A6D08' : '#AA2020'));

  const counts = {};
  for (let s = 2; s <= 12; s++) counts[s] = 0;
  sums.forEach(sum => { counts[sum] += 1; });
  const maxPct = Math.max(...Object.values(counts).map(c => (c / n) * 100), ...Object.values(THEORY)) * 1.15;

  body.innerHTML = `
    <div class="stats-row-4">
      <div class="stat-cell"><div class="stat-label">ВРЕМЯ</div><div class="stat-val">${Math.floor(totalThink / 60)}:${String(totalThink % 60).padStart(2, '0')}</div></div>
      <div class="stat-cell"><div class="stat-label">ХОДОВ</div><div class="stat-val">${n}</div></div>
      <div class="stat-cell"><div class="stat-label">СРЕДНЕЕ</div><div class="stat-val">${avg.toFixed(1)}</div></div>
      <div class="stat-cell"><div class="stat-label">ОТКЛ</div><div class="stat-val" style="color:${diffCol}">${sign}${diff.toFixed(1)}</div></div>
    </div>
    <div class="stats-section-label">РАСПРЕДЕЛЕНИЕ СУММ</div>
    <div class="chart-wrap"><canvas id="stats-chart"></canvas></div>
    <div class="stats-section-label">СОБЫТИЯ</div>
    <div class="tbl-events">
      <div class="tbl-head"><span>СОБЫТИЕ</span><span>КОЛ</span><span>ФАКТ%</span><span>ТЕОР%</span></div>
      ${eventsRows()}
      <div class="tbl-sep"></div>
      <div class="tbl-total"><span>ИТОГО</span><span>${n}</span></div>
    </div>
    <div class="stats-section-label">ДЕТАЛЬНО ПО СУММАМ</div>
    <div class="tbl-detail">
      <div class="tbl-head"><span>СУМ</span><span>КОЛ</span><span>ФАКТ%</span><span>ТЕОР%</span><span>ОТКЛ%</span></div>
      ${detailRows(counts, n)}
    </div>`;

  setTimeout(() => drawChart(counts, n, maxPct), 30);
}

function eventsRows() {
  const counts = countedEvents();
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.keys(EVENT_DEFS).map(key => {
    const event = EVENT_DEFS[key];
    const count = counts[key];
    const pct = (count / total) * 100;
    const th = EVENT_THEORY[key] || 0;
    const color = evTableColor(key);
    return `<div class="tbl-row">
      <span style="color:${color}">${event.name}</span>
      <span>${count}</span>
      <span style="color:${color}">${pct.toFixed(0)}%</span>
      <span style="color:var(--dim)">${th.toFixed(0)}%</span>
    </div>`;
  }).join('');
}

function detailRows(counts, n) {
  let html = '';
  for (let s = 2; s <= 12; s++) {
    const fact = (counts[s] / n) * 100;
    const theory = THEORY[s];
    const dev = fact - theory;
    const sign = dev >= 0 ? '+' : '';
    const color = isDark()
      ? (Math.abs(dev) < 3 ? '#7AE8A3' : (Math.abs(dev) < 6 ? '#E8C97A' : '#E87A7A'))
      : (Math.abs(dev) < 3 ? '#156830' : (Math.abs(dev) < 6 ? '#9A6D08' : '#AA2020'));
    html += `<div class="tbl-row">
      <span>${s}</span>
      <span>${counts[s]}</span>
      <span>${fact.toFixed(1)}%</span>
      <span style="color:var(--dim)">${theory.toFixed(1)}%</span>
      <span style="color:${color}">${sign}${dev.toFixed(1)}%</span>
    </div>`;
  }
  return html;
}

function drawChart(counts, n, maxPct) {
  const canvas = document.getElementById('stats-chart');
  if (!canvas) return;
  const W = canvas.parentElement.clientWidth - 2;
  const H = 210;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  const p = chartPalette();
  const padL = 8;
  const padR = 8;
  const padT = 44;
  const padB = 20;
  const bw = W - padL - padR;
  const bh = H - padT - padB;
  const slot = bw / 11;

  ctx.font = '10px Courier, monospace';

  for (let i = 0; i < 11; i++) {
    const s = i + 2;
    const xc = padL + (i + 0.5) * slot;
    const fact = (counts[s] / n) * 100;
    const theory = THEORY[s];
    const gap = Math.max(2, slot * 0.14);
    const factHeight = Math.max(2, (fact / maxPct) * bh);
    const factY = padT + bh - factHeight;

    ctx.fillStyle = p.bar;
    ctx.fillRect(xc - slot / 2 + gap, factY, slot - 2 * gap, factHeight);

    const theoryY = padT + bh - (theory / maxPct) * bh;
    ctx.strokeStyle = p.theory;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xc - slot / 2 + gap, theoryY);
    ctx.lineTo(xc + slot / 2 - gap, theoryY);
    ctx.stroke();

    if (counts[s] > 0) {
      ctx.fillStyle = p.label;
      ctx.textAlign = 'center';
      ctx.fillText(`${fact.toFixed(0)}%`, xc, factY - 14);
      ctx.fillStyle = p.dim;
      ctx.fillText(`(${counts[s]})`, xc, factY - 2);
    }

    ctx.fillStyle = p.dim;
    ctx.textAlign = 'center';
    ctx.fillText(String(s), xc, H - 2);
  }

  ctx.strokeStyle = p.base;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT + bh);
  ctx.lineTo(W - padR, padT + bh);
  ctx.stroke();

  ctx.fillStyle = p.bar;
  ctx.fillRect(W - 90, 5, 12, 8);
  ctx.fillStyle = p.dim;
  ctx.textAlign = 'left';
  ctx.fillText('факт', W - 76, 13);

  ctx.strokeStyle = p.theory;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W - 44, 9);
  ctx.lineTo(W - 32, 9);
  ctx.stroke();
  ctx.fillStyle = p.dim;
  ctx.fillText('теория', W - 30, 13);
}

function renderDie(canvas, value, color, highlight, ox = 0, oy = 0) {
  const ctx = canvas.getContext('2d');
  const s = canvas.width;
  const th = dieTheme();
  ctx.clearRect(0, 0, s, s);
  ctx.save();
  ctx.translate(ox, oy);

  const pad = 8;
  const r = 16;
  const x0 = pad;
  const y0 = pad;
  const x1 = s - pad;
  const y1 = s - pad;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  rrect(ctx, x0 + 4, y0 + 4, x1 + 4, y1 + 4, r, th.shadow);
  ctx.restore();

  rrect(ctx, x0, y0, x1, y1, r, th.face, color, highlight ? 3 : 2);

  const dr = Math.max(8, Math.floor(s / 16));
  (DOT_POS[value] || []).forEach(([px, py]) => {
    const cx = x0 + ((x1 - x0) * px) / 100;
    const cy = y0 + ((y1 - y0) * py) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, dr, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.restore();
}

function rrect(ctx, x0, y0, x1, y1, r, fill, stroke, sw) {
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
  ctx.lineTo(x1, y1 - r);
  ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
  ctx.lineTo(x0 + r, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
  ctx.lineTo(x0, y0 + r);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = sw || 2;
    ctx.stroke();
  }
}

function animateDie(canvas, finalVal, color, highlight) {
  let step = 0;
  function frame() {
    const amp = Math.max(1, 9 - step);
    const value = step === 15 ? finalVal : rnd6();
    const ox = Math.round((Math.random() * 2 - 1) * amp);
    const oy = Math.round((Math.random() * 2 - 1) * amp);
    renderDie(canvas, value, color, highlight, ox, oy);
    step += 1;
    if (step < 16) setTimeout(frame, 35);
    else renderDie(canvas, finalVal, color, highlight);
  }
  frame();
}

function bindModalClose(modalId, closeBtnId) {
  document.getElementById(closeBtnId).addEventListener('click', () => closeModal(modalId));
  document.getElementById(modalId).addEventListener('click', e => {
    if (e.target === document.getElementById(modalId)) closeModal(modalId);
  });
}

function init() {
  ['die1', 'die2'].forEach(id => {
    const canvas = document.getElementById(id);
    canvas.width = DICE_SIZE;
    canvas.height = DICE_SIZE;
  });
  renderDie(document.getElementById('die1'), 1, DIE_WHITE(), false);
  renderDie(document.getElementById('die2'), 1, DIE_RED, true);

  document.getElementById('roll-btn').addEventListener('click', () => roll());
  document.getElementById('stat-btn').addEventListener('click', () => {
    renderStats();
    openModal('stats-modal');
  });
  document.getElementById('history-btn').addEventListener('click', () => {
    renderHistoryModal();
    openModal('history-modal');
  });
  document.getElementById('settings-btn').addEventListener('click', () => {
    refreshSettingsUI();
    openModal('settings-modal');
  });
  document.getElementById('alchemist-btn').addEventListener('click', () => {
    renderAlchemySelectors();
    openModal('alchemist-modal');
  });

  document.getElementById('pause-btn').addEventListener('click', pauseTimer);
  document.getElementById('play-btn').addEventListener('click', () => {
    if (state.timerPaused) resumeTimer();
    else if (!state.timerRunning) startTimer(!state.timerStarted);
  });

  document.getElementById('mode-random').addEventListener('click', () => setRollMode('random'));
  document.getElementById('mode-exhaust').addEventListener('click', () => setRollMode('exhaust'));
  document.getElementById('event-mode-random').addEventListener('click', () => setEventMode('random'));
  document.getElementById('event-mode-exhaust').addEventListener('click', () => setEventMode('exhaust'));
  document.getElementById('barbarian-toggle').addEventListener('change', e => setBarbarianTracking(e.target.checked));
  document.getElementById('simultaneous-toggle').addEventListener('change', e => setSimultaneousMode(e.target.checked));
  document.querySelectorAll('.time-chip').forEach(btn => {
    btn.addEventListener('click', () => setTimeLimit(Number(btn.dataset.t)));
  });

  document.getElementById('apply-custom-time').addEventListener('click', () => {
    const raw = Number(document.getElementById('custom-time-input').value);
    setTimeLimit(Number.isFinite(raw) ? raw : 0);
  });
  document.getElementById('join-code-input').addEventListener('input', e => {
    e.target.value = sanitizeJoinCode(e.target.value);
  });
  document.getElementById('create-sync-btn').addEventListener('click', async () => {
    try {
      await createSyncSession();
    } catch (error) {
      window.alert('Не удалось создать код игры.');
    }
  });
  document.getElementById('join-sync-btn').addEventListener('click', async () => {
    const code = document.getElementById('join-code-input').value;
    try {
      await joinSyncSession(code);
    } catch (error) {
      window.alert('Не удалось подключиться к игре по этому коду.');
    }
  });
  document.getElementById('leave-sync-btn').addEventListener('click', leaveSyncSession);
  document.getElementById('new-game-btn').addEventListener('click', resetGame);
  document.getElementById('undo-last-btn').addEventListener('click', undoLastTurn);
  document.getElementById('apply-alchemist-btn').addEventListener('click', () => {
    closeModal('alchemist-modal');
    roll({ alchemist: true, alchemyDice: [state.alchemyDie1, state.alchemyDie2] });
  });

  bindModalClose('stats-modal', 'btn-x');
  bindModalClose('settings-modal', 'btn-settings-x');
  bindModalClose('history-modal', 'btn-history-x');
  bindModalClose('alchemist-modal', 'btn-alchemist-x');
  document.getElementById('btn-close-modal').addEventListener('click', () => closeModal('stats-modal'));
  document.getElementById('btn-close-settings').addEventListener('click', () => closeModal('settings-modal'));
  document.getElementById('btn-close-history').addEventListener('click', () => closeModal('history-modal'));
  document.getElementById('btn-close-alchemist').addEventListener('click', () => closeModal('alchemist-modal'));

  renderAlchemySelectors();
  refreshSettingsUI();
  renderRollCount();
  renderCounters();
  renderHistory();
  renderStartEventState();
  updateTimerDisplay();
  setTimerStyle();
  renderSyncUI();
  ensureAutoSession();
}

function renderAlchemySelectors() {
  drawChoiceGrid('alchemy-die1', state.alchemyDie1, value => {
    state.alchemyDie1 = value;
    renderAlchemySelectors();
  });
  drawChoiceGrid('alchemy-die2', state.alchemyDie2, value => {
    state.alchemyDie2 = value;
    renderAlchemySelectors();
  });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.lastEventView) renderEventState(state.lastEventView);
  else renderStartEventState();
  renderHistory();
  if (!document.getElementById('stats-modal').classList.contains('modal-hidden')) renderStats();
});

init();
