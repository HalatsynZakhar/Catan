'use strict';

// ── Data ─────────────────────────────────────────────────────
const EVENTS = [
  { name: 'Жёлтая овца',    sub: 'ткань',  color: '#E8C97A', imgBase: 'Yellow'  },
  { name: 'Синий камень',   sub: 'монеты', color: '#7A9FE8', imgBase: 'Blue'    },
  { name: 'Зелёная бумага', sub: 'дерево', color: '#7AE8A3', imgBase: 'Green'   },
  { name: 'Варвары!',       sub: '',       color: '#E87A7A', imgBase: null       },
  { name: 'Варвары!',       sub: '',       color: '#E87A7A', imgBase: null       },
  { name: 'Варвары!',       sub: '',       color: '#E87A7A', imgBase: null       },
];

// Фиксированные цвета кубиков (независимо от события)
const DIE_WHITE = () => isDark() ? '#EEEEFF' : '#1A180E';
const DIE_RED   = '#E87A7A';

const DOT_POS = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,24],[72,24],[28,50],[72,50],[28,76],[72,76]],
};

const THEORY = {
  2:2.78, 3:5.56, 4:8.33, 5:11.11, 6:13.89,
  7:16.67, 8:13.89, 9:11.11, 10:8.33, 11:5.56, 12:2.78,
};

const EV_THEORY = { 'Варвары!': 50.0, 'Жёлтая овца': 16.7, 'Синий камень': 16.7, 'Зелёная бумага': 16.7 };

// Event colors switch with theme — darker in light mode for contrast on white
const EV_COLORS_DARK  = { 'Варвары!': '#E87A7A', 'Жёлтая овца': '#E8C97A', 'Синий камень': '#7A9FE8', 'Зелёная бумага': '#7AE8A3' };
const EV_COLORS_LIGHT = { 'Варвары!': '#AA2020', 'Жёлтая овца': '#9A6D08', 'Синий камень': '#1A4898', 'Зелёная бумага': '#156830' };

// Event roll colors (on dice / highlights) — always vivid; same for both themes
const EV_COLORS = EV_COLORS_DARK;

function isDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function evTableColor(name) {
  return isDark() ? EV_COLORS_DARK[name] : EV_COLORS_LIGHT[name];
}

// Die face colors per theme
function dieTheme() {
  if (isDark()) {
    return { face: '#1A1A2E', shadow: '#050510', highlight: '#EEEEFF' };
  } else {
    return { face: '#E8E4D8', shadow: '#A09A88', highlight: '#1A180E' };
  }
}

// Chart palette per theme
function chartPalette() {
  if (isDark()) {
    return { bar: '#7A9FE8', theory: '#E87A7A', label: '#EEEEFF', dim: '#5A5A7A', base: '#2A2A40' };
  } else {
    return { bar: '#1A4898', theory: '#AA2020', label: '#1A180E', dim: '#7A7260', base: '#C8C2AC' };
  }
}

// ── State ─────────────────────────────────────────────────────
let rollCount    = 0;
let sums         = [];
let history      = [];
let evCounts     = { 'Жёлтая овца': 0, 'Синий камень': 0, 'Зелёная бумага': 0, 'Варвары!': 0 };
let totalThink   = 0;
let timerSecs    = 0;
let timerRunning = false;
let timerIval    = null;
let locked       = false;

// ── Canvas size: dice are now in a row alongside sum block ───
const DICE_SIZE = (() => {
  const appW   = Math.min(window.innerWidth, 500) - 24; // minus app padding
  const sumW   = Math.max(68, Math.floor(appW * 0.22));  // sum block ~22%
  const gaps   = 10 + 8;                                  // row-gap + dice-gap
  return Math.min(Math.floor((appW - sumW - gaps) / 2), 130);
})();

// ── Init ──────────────────────────────────────────────────────
(function init() {
  const c1 = document.getElementById('die1');
  const c2 = document.getElementById('die2');
  [c1, c2].forEach(c => { c.width = DICE_SIZE; c.height = DICE_SIZE; });
  renderDie(c1, 1, DIE_WHITE(), false);
  renderDie(c2, 1, DIE_RED,   true);

  document.getElementById('roll-btn').addEventListener('click', roll);
  document.getElementById('stat-btn').addEventListener('click', showStats);
  document.getElementById('btn-x').addEventListener('click', closeStats);
  document.getElementById('btn-close-modal').addEventListener('click', closeStats);
  document.getElementById('stats-modal').addEventListener('click', closeStatsOutside);
})();

// ── Dice drawing ──────────────────────────────────────────────
function renderDie(canvas, value, color, highlight, ox = 0, oy = 0) {
  const ctx = canvas.getContext('2d');
  const s   = canvas.width;
  const th  = dieTheme();
  ctx.clearRect(0, 0, s, s);
  ctx.save();
  ctx.translate(ox, oy);

  const pad = 8, r = 16;
  const x0 = pad, y0 = pad, x1 = s - pad, y1 = s - pad;

  // Shadow
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur    = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  rrect(ctx, x0 + 4, y0 + 4, x1 + 4, y1 + 4, r, th.shadow);
  ctx.restore();

  // Face
  const bw = highlight ? 3 : 2;
  rrect(ctx, x0, y0, x1, y1, r, th.face, color, bw);

  // Dots
  const dr   = Math.max(8, Math.floor(s / 16));
  const dotC = color;
  (DOT_POS[value] || []).forEach(([px, py]) => {
    const cx = x0 + (x1 - x0) * px / 100;
    const cy = y0 + (y1 - y0) * py / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, dr, 0, Math.PI * 2);
    ctx.fillStyle = dotC;
    ctx.fill();
  });

  ctx.restore();
}

function rrect(ctx, x0, y0, x1, y1, r, fill, stroke, sw) {
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);  ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
  ctx.lineTo(x1, y1 - r);  ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
  ctx.lineTo(x0 + r, y1);  ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
  ctx.lineTo(x0, y0 + r);  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 2; ctx.stroke(); }
}

function animateDie(canvas, finalVal, color, highlight) {
  let step = 0;
  const total = 16;
  function frame() {
    const amp = Math.max(1, 9 - step);
    const v   = step === total - 1 ? finalVal : (Math.ceil(Math.random() * 6));
    const ox  = Math.round((Math.random() * 2 - 1) * amp);
    const oy  = Math.round((Math.random() * 2 - 1) * amp);
    renderDie(canvas, v, color, highlight, ox, oy);
    step++;
    if (step < total) setTimeout(frame, 35);
    else renderDie(canvas, finalVal, color, highlight);
  }
  frame();
}

// ── Timer ─────────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  timerSecs    = 0;
  timerRunning = true;
  document.getElementById('timer').textContent = '0 с';
  timerIval = setInterval(() => {
    timerSecs++;
    document.getElementById('timer').textContent = timerSecs + ' с';
  }, 1000);
}

function stopTimer() {
  if (timerIval) { clearInterval(timerIval); timerIval = null; }
  const elapsed    = timerRunning ? timerSecs : null;
  timerRunning     = false;
  document.getElementById('timer').textContent = '\u00A0';
  return elapsed;
}

// ── Roll ──────────────────────────────────────────────────────
function roll() {
  if (locked) return;
  locked = true;

  const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const d1    = Math.ceil(Math.random() * 6);
  const d2    = Math.ceil(Math.random() * 6);
  const total = d1 + d2;

  const elapsed = stopTimer();
  if (elapsed !== null) totalThink += elapsed;

  sums.push(total);
  evCounts[event.name]++;
  rollCount++;

  document.getElementById('roll-count').textContent = `Бросков: ${rollCount}`;
  document.getElementById('roll-btn').disabled = true;

  // History
  const think = elapsed !== null ? ` [${elapsed}с]` : '';
  history.unshift(`#${rollCount}  ${event.name}  ${d1}+${d2}=${total}${think}`);
  history = history.slice(0, 4);
  for (let i = 0; i < 4; i++) {
    document.getElementById(`hist-${i}`).textContent = history[i] || '\u00A0';
  }

  // Animate — die1 белый, die2 красный (всегда)
  animateDie(document.getElementById('die1'), d1, DIE_WHITE(), false);
  animateDie(document.getElementById('die2'), d2, DIE_RED,    true);

  setTimeout(() => {
    updateEventUI(event, d2, total);
    document.getElementById('roll-btn').disabled = false;
    locked = false;
    setTimeout(startTimer, 80);
  }, 660);
}

function updateEventUI(event, d2, total) {
  const isBarbarians = event.name === 'Варвары!';

  const nameEl        = document.getElementById('event-name');
  const subEl         = document.getElementById('event-sub');
  const imgEl         = document.getElementById('event-img');
  const sectionEl     = document.getElementById('event-section');
  const placeholderEl = document.getElementById('event-placeholder');
  const sumEl         = document.getElementById('sum-value');
  const sumBlock      = document.querySelector('.sum-block');

  nameEl.textContent = isBarbarians ? 'Варвары!' : `${event.name} (${d2})`;
  nameEl.style.color = event.color;
  subEl.textContent  = event.sub ? `(${event.sub})` : '\u00A0';

  imgEl.src = event.imgBase
    ? `/images/${event.imgBase}${d2}.png`
    : '/images/barbarians.svg';
  imgEl.classList.add('shown');
  placeholderEl.classList.add('hidden');

  sectionEl.style.borderColor = event.color;
  sectionEl.style.boxShadow   = `0 0 20px ${event.color}33`;

  sumEl.textContent       = String(total);
  sumEl.style.color       = event.color;
  sumBlock.style.borderColor = event.color;
}

// ── Stats ─────────────────────────────────────────────────────
function showStats() {
  document.getElementById('stats-modal').classList.remove('modal-hidden');
  renderStats();
}

function closeStats() {
  document.getElementById('stats-modal').classList.add('modal-hidden');
}

function closeStatsOutside(e) {
  if (e.target === document.getElementById('stats-modal')) closeStats();
}

function renderStats() {
  const body = document.getElementById('stats-body');
  const n    = sums.length;

  if (n === 0) {
    body.innerHTML = '<div class="no-data">Нет данных</div>';
    return;
  }

  const curSec   = timerRunning ? timerSecs : 0;
  const totSec   = totalThink + curSec;
  const mins     = Math.floor(totSec / 60);
  const secs     = totSec % 60;
  const avg      = sums.reduce((a, b) => a + b, 0) / n;
  const diff     = avg - 7.0;
  const sign     = diff >= 0 ? '+' : '';
  const diffCol  = isDark()
    ? (Math.abs(diff) < 0.5 ? '#7AE8A3' : (Math.abs(diff) < 1.5 ? '#E8C97A' : '#E87A7A'))
    : (Math.abs(diff) < 0.5 ? '#156830' : (Math.abs(diff) < 1.5 ? '#9A6D08' : '#AA2020'));

  const counts = {};
  for (let s = 2; s <= 12; s++) counts[s] = 0;
  sums.forEach(s => counts[s]++);

  const maxPct = Math.max(
    ...Object.values(counts).map(c => c / n * 100),
    ...Object.values(THEORY)
  ) * 1.15;

  body.innerHTML = `
    <div class="stats-row-4">
      <div class="stat-cell"><div class="stat-label">ВРЕМЯ</div><div class="stat-val">${mins}:${String(secs).padStart(2,'0')}</div></div>
      <div class="stat-cell"><div class="stat-label">БРОСКОВ</div><div class="stat-val">${n}</div></div>
      <div class="stat-cell"><div class="stat-label">СРЕДНЕЕ</div><div class="stat-val">${avg.toFixed(1)}</div></div>
      <div class="stat-cell"><div class="stat-label">ОТКЛ</div><div class="stat-val" style="color:${diffCol}">${sign}${diff.toFixed(1)}</div></div>
    </div>

    <div class="stats-section-label">РАСПРЕДЕЛЕНИЕ СУММ</div>
    <div class="card chart-wrap"><canvas id="stats-chart"></canvas></div>

    <div class="stats-section-label">СОБЫТИЯ</div>
    <div class="tbl-events">
      <div class="tbl-head"><span>СОБЫТИЕ</span><span>КОЛ</span><span>ФАКТ%</span><span>ТЕОР%</span></div>
      ${eventsRows()}
      <div class="tbl-sep"></div>
      <div class="tbl-total">
        <span>ИТОГО</span>
        <span>${Object.values(evCounts).reduce((a,b)=>a+b,0)}</span>
      </div>
    </div>

    <div class="stats-section-label">ДЕТАЛЬНО ПО СУММАМ</div>
    <div class="tbl-detail">
      <div class="tbl-head"><span>СУМ</span><span>КОЛ</span><span>ФАКТ%</span><span>ТЕОР%</span><span>ОТКЛ%</span></div>
      ${detailRows(counts, n)}
    </div>
  `;

  setTimeout(() => drawChart(counts, n, maxPct), 30);
}

function eventsRows() {
  const total = Object.values(evCounts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(evCounts).map(([name, cnt]) => {
    const pct = cnt / total * 100;
    const th  = EV_THEORY[name] || 0;
    const col = evTableColor(name);
    return `<div class="tbl-row">
      <span style="color:${col}">${name}</span>
      <span>${cnt}</span>
      <span style="color:${col}">${pct.toFixed(0)}%</span>
      <span style="color:var(--dim)">${th.toFixed(0)}%</span>
    </div>`;
  }).join('');
}

function detailRows(counts, n) {
  let html = '';
  for (let s = 2; s <= 12; s++) {
    const fp   = counts[s] / n * 100;
    const tp   = THEORY[s];
    const dev  = fp - tp;
    const sign = dev >= 0 ? '+' : '';
    const col  = isDark()
      ? (Math.abs(dev) < 3 ? '#7AE8A3' : (Math.abs(dev) < 6 ? '#E8C97A' : '#E87A7A'))
      : (Math.abs(dev) < 3 ? '#156830' : (Math.abs(dev) < 6 ? '#9A6D08' : '#AA2020'));
    html += `<div class="tbl-row">
      <span>${s}</span>
      <span>${counts[s]}</span>
      <span>${fp.toFixed(1)}%</span>
      <span style="color:var(--dim)">${tp.toFixed(1)}%</span>
      <span style="color:${col}">${sign}${dev.toFixed(1)}%</span>
    </div>`;
  }
  return html;
}

function drawChart(counts, n, maxPct) {
  const canvas = document.getElementById('stats-chart');
  if (!canvas) return;
  const W = canvas.parentElement.clientWidth - 2;
  const H = 210;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  const p   = chartPalette();
  const padL = 8, padR = 8, padT = 44, padB = 20;
  const bw   = W - padL - padR;
  const bh   = H - padT - padB;
  const slot = bw / 11;

  ctx.font = '10px Courier, monospace';

  for (let i = 0; i < 11; i++) {
    const s   = i + 2;
    const xc  = padL + (i + 0.5) * slot;
    const fp  = counts[s] / n * 100;
    const tp  = THEORY[s];
    const gap = Math.max(2, slot * 0.14);

    // Fact bar
    const fh = Math.max(2, fp / maxPct * bh);
    const fy = padT + bh - fh;
    ctx.fillStyle = p.bar;
    ctx.fillRect(xc - slot / 2 + gap, fy, slot - 2 * gap, fh);

    // Theory line
    const ty = padT + bh - (tp / maxPct * bh);
    ctx.strokeStyle = p.theory;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(xc - slot / 2 + gap, ty);
    ctx.lineTo(xc + slot / 2 - gap, ty);
    ctx.stroke();

    // Labels above bar
    if (counts[s] > 0) {
      ctx.fillStyle = p.label;
      ctx.textAlign = 'center';
      ctx.fillText(`${fp.toFixed(0)}%`, xc, fy - 14);
      ctx.fillStyle = p.dim;
      ctx.fillText(`(${counts[s]})`, xc, fy - 2);
    }

    // Sum label below
    ctx.fillStyle = p.dim;
    ctx.textAlign = 'center';
    ctx.fillText(String(s), xc, H - 2);
  }

  // Baseline
  ctx.strokeStyle = p.base;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT + bh);
  ctx.lineTo(W - padR, padT + bh);
  ctx.stroke();

  // Legend
  ctx.fillStyle = p.bar;
  ctx.fillRect(W - 90, 5, 12, 8);
  ctx.fillStyle = p.dim;
  ctx.textAlign = 'left';
  ctx.fillText('факт', W - 76, 13);
  ctx.strokeStyle = p.theory;
  ctx.lineWidth   = 3;
  ctx.beginPath(); ctx.moveTo(W - 44, 9); ctx.lineTo(W - 32, 9); ctx.stroke();
  ctx.fillStyle = p.dim;
  ctx.fillText('теория', W - 30, 13);
}
