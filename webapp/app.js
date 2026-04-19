'use strict';

// ── Data ─────────────────────────────────────────────────────
const EVENTS = [
  { name: 'Торговля', sub: 'Ткань (Шерсть)', color: '#E8C97A', imgBase: 'Yellow' },
  { name: 'Политика', sub: 'Монеты (Руда)',   color: '#7A9FE8', imgBase: 'Blue'   },
  { name: 'Учёность', sub: 'Бумага (Дерево)', color: '#7AE8A3', imgBase: 'Green'  },
  { name: 'Варвары!', sub: '',                color: '#E87A7A', imgBase: null      },
  { name: 'Варвары!', sub: '',                color: '#E87A7A', imgBase: null      },
  { name: 'Варвары!', sub: '',                color: '#E87A7A', imgBase: null      },
];

const DOT_POS = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,24],[72,24],[28,50],[72,50],[28,76],[72,76]],
};

const THEORY = {
  2:2.78,3:5.56,4:8.33,5:11.11,6:13.89,
  7:16.67,8:13.89,9:11.11,10:8.33,11:5.56,12:2.78,
};

const EV_THEORY = { 'Варвары!':50,'Торговля':16.7,'Политика':16.7,'Учёность':16.7 };
const EV_COLORS_DARK  = { 'Варвары!':'#E87A7A','Торговля':'#E8C97A','Политика':'#7A9FE8','Учёность':'#7AE8A3' };
const EV_COLORS_LIGHT = { 'Варвары!':'#AA2020','Торговля':'#9A6D08','Политика':'#1A4898','Учёность':'#156830' };

function isDark() { return window.matchMedia('(prefers-color-scheme: dark)').matches; }
function evTableColor(n) { return isDark() ? EV_COLORS_DARK[n] : EV_COLORS_LIGHT[n]; }

const DIE_WHITE = () => isDark() ? '#EEEEFF' : '#1A180E';
const DIE_RED   = '#E87A7A';

// ── Die theme ─────────────────────────────────────────────────
function dieTheme() {
  return isDark()
    ? { face: '#1A1A2E', shadow: '#050510' }
    : { face: '#E8E4D8', shadow: '#A09A88' };
}

function chartPalette() {
  return isDark()
    ? { bar:'#7A9FE8', theory:'#E87A7A', label:'#EEEEFF', dim:'#5A5A7A', base:'#2A2A40' }
    : { bar:'#1A4898', theory:'#AA2020', label:'#1A180E', dim:'#7A7260', base:'#C8C2AC' };
}

// ── State ─────────────────────────────────────────────────────
let rollCount    = 0;
let sums         = [];
let history      = [];
let evCounts     = { 'Торговля':0,'Политика':0,'Учёность':0,'Варвары!':0 };
let totalThink   = 0;
let locked       = false;

// ── Timer ─────────────────────────────────────────────────────
let timeLimit    = 0;     // 0 = count-up (no limit)
let timerSecs    = 0;
let timerRunning = false;
let timerIval    = null;
let alarmActive  = false;

function formatTime(s) {
  if (s >= 60) return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  return String(s);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-value');
  if (!timerRunning && !alarmActive) { el.textContent = '—'; return; }
  el.textContent = timeLimit > 0 ? formatTime(timerSecs) : `${timerSecs}с`;
}

function setTimerStyle() {
  const d = document.getElementById('timer-display');
  d.classList.remove('warning', 'danger', 'alarm');
  if (alarmActive) { d.classList.add('alarm'); return; }
  if (timeLimit > 0 && timerRunning) {
    const pct = timerSecs / timeLimit;
    if (pct < 0.25)      d.classList.add('danger');
    else if (pct < 0.5)  d.classList.add('warning');
  }
}

function triggerAlarm() {
  clearInterval(timerIval); timerIval = null;
  timerRunning = false; alarmActive = true;
  setTimerStyle();
  updateTimerDisplay();
  document.getElementById('roll-btn').classList.add('alarm');
  if (navigator.vibrate) navigator.vibrate([300,100,300,100,500]);
}

function startTimer() {
  stopTimer();
  timerSecs    = timeLimit;  // 0 for count-up, limit for countdown
  timerRunning = true;
  alarmActive  = false;
  updateTimerDisplay();
  setTimerStyle();
  timerIval = setInterval(() => {
    if (timeLimit > 0) {
      timerSecs--;
      if (timerSecs <= 0) { timerSecs = 0; updateTimerDisplay(); triggerAlarm(); return; }
    } else {
      timerSecs++;
    }
    updateTimerDisplay();
    setTimerStyle();
  }, 1000);
}

function stopTimer() {
  if (timerIval) { clearInterval(timerIval); timerIval = null; }
  const elapsed = (timerRunning || alarmActive)
    ? (timeLimit > 0 ? timeLimit - timerSecs : timerSecs)
    : null;
  timerRunning = false; alarmActive = false;
  document.getElementById('timer-display').classList.remove('warning','danger','alarm');
  document.getElementById('roll-btn').classList.remove('alarm');
  updateTimerDisplay();
  return elapsed;
}

// ── Roll mode (dice) ──────────────────────────────────────────
let rollMode    = 'random';
let exhaustDeck = [];
let exhaustIdx  = 0;

// ── Event mode ────────────────────────────────────────────────
let eventMode    = 'random';
let eventDeck    = [];
let eventIdx     = 0;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function getNextDice() {
  if (rollMode === 'random') return [rnd6(), rnd6()];
  if (exhaustIdx >= exhaustDeck.length) {
    exhaustDeck = shuffle(
      Array.from({length:36}, (_,i) => [Math.floor(i/6)+1, (i%6)+1])
    );
    exhaustIdx = 0;
  }
  return exhaustDeck[exhaustIdx++];
}

function getNextEvent() {
  if (eventMode === 'random') return EVENTS[Math.floor(Math.random()*EVENTS.length)];
  if (eventIdx >= eventDeck.length) {
    eventDeck = shuffle(EVENTS);
    eventIdx  = 0;
  }
  return eventDeck[eventIdx++];
}

function rnd6() { return Math.ceil(Math.random()*6); }

function updateDeckCounter() {
  const el = document.getElementById('deck-counter');
  if (rollMode === 'exhaust') {
    el.textContent = `кубики: ${exhaustIdx}/36`;
  } else {
    el.textContent = '';
  }
}

// ── Canvas size ───────────────────────────────────────────────
const DICE_SIZE = (() => {
  const w   = Math.min(window.innerWidth, 500) - 24;
  const sumW = Math.max(68, Math.floor(w * 0.22));
  return Math.min(Math.floor((w - sumW - 18) / 2), 130);
})();

// ── Init ──────────────────────────────────────────────────────
(function init() {
  ['die1','die2'].forEach(id => {
    const c = document.getElementById(id);
    c.width = DICE_SIZE; c.height = DICE_SIZE;
  });
  renderDie(document.getElementById('die1'), 1, DIE_WHITE(), false);
  renderDie(document.getElementById('die2'), 1, DIE_RED,    true);

  document.getElementById('roll-btn').addEventListener('click', roll);
  document.getElementById('stat-btn').addEventListener('click', showStats);
  document.getElementById('btn-x').addEventListener('click', closeStats);
  document.getElementById('btn-close-modal').addEventListener('click', closeStats);
  document.getElementById('stats-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('stats-modal')) closeStats();
  });

  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('btn-settings-x').addEventListener('click', closeSettings);
  document.getElementById('btn-close-settings').addEventListener('click', closeSettings);
  document.getElementById('settings-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('settings-modal')) closeSettings();
  });

  // Dice mode
  document.getElementById('mode-random').addEventListener('click', () => setRollMode('random'));
  document.getElementById('mode-exhaust').addEventListener('click', () => setRollMode('exhaust'));

  // Event mode
  document.getElementById('event-mode-random').addEventListener('click', () => setEventMode('random'));
  document.getElementById('event-mode-exhaust').addEventListener('click', () => setEventMode('exhaust'));

  // Time chips
  document.querySelectorAll('.time-chip').forEach(btn => {
    btn.addEventListener('click', () => setTimeLimit(Number(btn.dataset.t)));
  });

  refreshSettingsUI();
  updateTimerDisplay();
})();

// ── Dice drawing ──────────────────────────────────────────────
function renderDie(canvas, value, color, highlight, ox=0, oy=0) {
  const ctx = canvas.getContext('2d');
  const s   = canvas.width;
  const th  = dieTheme();
  ctx.clearRect(0,0,s,s);
  ctx.save(); ctx.translate(ox,oy);

  const pad=8, r=16, x0=pad, y0=pad, x1=s-pad, y1=s-pad;

  ctx.save();
  ctx.shadowColor='rgba(0,0,0,.5)'; ctx.shadowBlur=10;
  ctx.shadowOffsetX=4; ctx.shadowOffsetY=4;
  rrect(ctx, x0+4, y0+4, x1+4, y1+4, r, th.shadow);
  ctx.restore();

  rrect(ctx, x0, y0, x1, y1, r, th.face, color, highlight ? 3 : 2);

  const dr = Math.max(8, Math.floor(s/16));
  (DOT_POS[value]||[]).forEach(([px,py]) => {
    const cx = x0+(x1-x0)*px/100, cy = y0+(y1-y0)*py/100;
    ctx.beginPath(); ctx.arc(cx,cy,dr,0,Math.PI*2);
    ctx.fillStyle = color; ctx.fill();
  });
  ctx.restore();
}

function rrect(ctx, x0,y0,x1,y1, r, fill, stroke, sw) {
  ctx.beginPath();
  ctx.moveTo(x0+r,y0); ctx.lineTo(x1-r,y0); ctx.quadraticCurveTo(x1,y0,x1,y0+r);
  ctx.lineTo(x1,y1-r); ctx.quadraticCurveTo(x1,y1,x1-r,y1);
  ctx.lineTo(x0+r,y1); ctx.quadraticCurveTo(x0,y1,x0,y1-r);
  ctx.lineTo(x0,y0+r); ctx.quadraticCurveTo(x0,y0,x0+r,y0);
  ctx.closePath();
  ctx.fillStyle=fill; ctx.fill();
  if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=sw||2; ctx.stroke(); }
}

function animateDie(canvas, finalVal, color, highlight) {
  let step=0;
  function frame() {
    const amp=Math.max(1,9-step);
    const v = step===15 ? finalVal : rnd6();
    const ox=Math.round((Math.random()*2-1)*amp);
    const oy=Math.round((Math.random()*2-1)*amp);
    renderDie(canvas, v, color, highlight, ox, oy);
    step++;
    if (step<16) setTimeout(frame,35);
    else renderDie(canvas, finalVal, color, highlight);
  }
  frame();
}

// ── Roll ──────────────────────────────────────────────────────
function roll() {
  if (locked) return;
  locked = true;

  const elapsed = stopTimer();
  if (elapsed !== null) totalThink += elapsed;

  const event    = getNextEvent();
  const [d1, d2] = getNextDice();
  const total    = d1 + d2;

  sums.push(total);
  evCounts[event.name]++;
  rollCount++;

  document.getElementById('roll-count').textContent = `Бросков: ${rollCount}`;
  document.getElementById('roll-btn').disabled = true;
  updateDeckCounter();

  const think = elapsed !== null ? ` [${elapsed}с]` : '';
  history.unshift(`#${rollCount}  ${event.name}  ${d1}+${d2}=${total}${think}`);
  history = history.slice(0,4);
  for (let i=0;i<4;i++)
    document.getElementById(`hist-${i}`).textContent = history[i]||'\u00A0';

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
  document.getElementById('event-name').textContent = isBarbarians ? 'Варвары!' : `${event.name} (${d2})`;
  document.getElementById('event-name').style.color = event.color;
  document.getElementById('event-sub').textContent  = event.sub || '\u00A0';
  document.getElementById('event-sub').style.color  = event.color;

  const imgEl = document.getElementById('event-img');
  imgEl.src = event.imgBase ? `/images/${event.imgBase}${d2}.png` : '/images/barbarians.svg';
  imgEl.classList.add('shown');
  document.getElementById('event-placeholder').classList.add('hidden');

  const sec = document.getElementById('event-section');
  sec.style.borderColor = event.color;
  sec.style.boxShadow   = `0 0 20px ${event.color}33`;
  document.getElementById('event-caption').style.borderTopColor = event.color;

  document.getElementById('sum-value').textContent       = String(total);
  document.getElementById('sum-value').style.color       = event.color;
  document.getElementById('sum-block').style.borderColor = event.color;
}

// ── Settings ──────────────────────────────────────────────────
function openSettings() {
  refreshSettingsUI();
  document.getElementById('settings-modal').classList.remove('modal-hidden');
}
function closeSettings() {
  document.getElementById('settings-modal').classList.add('modal-hidden');
}

function setRollMode(mode) {
  rollMode = mode;
  if (mode === 'exhaust') { exhaustDeck = []; exhaustIdx = 0; }
  updateDeckCounter();
  refreshSettingsUI();
}

function setEventMode(mode) {
  eventMode = mode;
  if (mode === 'exhaust') { eventDeck = []; eventIdx = 0; }
  refreshSettingsUI();
}

function setTimeLimit(secs) {
  timeLimit = secs;
  stopTimer();
  refreshSettingsUI();
}

function refreshSettingsUI() {
  document.getElementById('mode-random').classList.toggle('selected', rollMode==='random');
  document.getElementById('mode-exhaust').classList.toggle('selected', rollMode==='exhaust');
  document.getElementById('event-mode-random').classList.toggle('selected', eventMode==='random');
  document.getElementById('event-mode-exhaust').classList.toggle('selected', eventMode==='exhaust');
  document.querySelectorAll('.time-chip').forEach(btn => {
    btn.classList.toggle('selected', Number(btn.dataset.t) === timeLimit);
  });
}

// ── Stats ─────────────────────────────────────────────────────
function showStats() {
  document.getElementById('stats-modal').classList.remove('modal-hidden');
  renderStats();
}
function closeStats() {
  document.getElementById('stats-modal').classList.add('modal-hidden');
}

function renderStats() {
  const body = document.getElementById('stats-body');
  const n    = sums.length;
  if (n === 0) { body.innerHTML = '<div class="no-data">Нет данных</div>'; return; }

  const curSec = (timerRunning||alarmActive) ? (timeLimit>0 ? timeLimit-timerSecs : timerSecs) : 0;
  const totSec = totalThink + curSec;
  const avg    = sums.reduce((a,b)=>a+b,0)/n;
  const diff   = avg-7;
  const sign   = diff>=0?'+':'';
  const diffCol = isDark()
    ? (Math.abs(diff)<.5?'#7AE8A3':(Math.abs(diff)<1.5?'#E8C97A':'#E87A7A'))
    : (Math.abs(diff)<.5?'#156830':(Math.abs(diff)<1.5?'#9A6D08':'#AA2020'));

  const counts={};
  for(let s=2;s<=12;s++) counts[s]=0;
  sums.forEach(s=>counts[s]++);
  const maxPct = Math.max(...Object.values(counts).map(c=>c/n*100),...Object.values(THEORY))*1.15;

  body.innerHTML = `
    <div class="stats-row-4">
      <div class="stat-cell"><div class="stat-label">ВРЕМЯ</div><div class="stat-val">${Math.floor(totSec/60)}:${String(totSec%60).padStart(2,'0')}</div></div>
      <div class="stat-cell"><div class="stat-label">БРОСКОВ</div><div class="stat-val">${n}</div></div>
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
      <div class="tbl-total"><span>ИТОГО</span><span>${Object.values(evCounts).reduce((a,b)=>a+b,0)}</span></div>
    </div>
    <div class="stats-section-label">ДЕТАЛЬНО ПО СУММАМ</div>
    <div class="tbl-detail">
      <div class="tbl-head"><span>СУМ</span><span>КОЛ</span><span>ФАКТ%</span><span>ТЕОР%</span><span>ОТКЛ%</span></div>
      ${detailRows(counts,n)}
    </div>`;

  setTimeout(()=>drawChart(counts,n,maxPct), 30);
}

function eventsRows() {
  const total = Object.values(evCounts).reduce((a,b)=>a+b,0)||1;
  return Object.entries(evCounts).map(([name,cnt])=>{
    const pct=cnt/total*100, th=EV_THEORY[name]||0, col=evTableColor(name);
    return `<div class="tbl-row">
      <span style="color:${col}">${name}</span><span>${cnt}</span>
      <span style="color:${col}">${pct.toFixed(0)}%</span>
      <span style="color:var(--dim)">${th.toFixed(0)}%</span></div>`;
  }).join('');
}

function detailRows(counts,n) {
  let h='';
  for(let s=2;s<=12;s++){
    const fp=counts[s]/n*100, tp=THEORY[s], dev=fp-tp, sign=dev>=0?'+':'';
    const col=isDark()
      ?(Math.abs(dev)<3?'#7AE8A3':(Math.abs(dev)<6?'#E8C97A':'#E87A7A'))
      :(Math.abs(dev)<3?'#156830':(Math.abs(dev)<6?'#9A6D08':'#AA2020'));
    h+=`<div class="tbl-row"><span>${s}</span><span>${counts[s]}</span>
      <span>${fp.toFixed(1)}%</span><span style="color:var(--dim)">${tp.toFixed(1)}%</span>
      <span style="color:${col}">${sign}${dev.toFixed(1)}%</span></div>`;
  }
  return h;
}

function drawChart(counts,n,maxPct) {
  const canvas=document.getElementById('stats-chart'); if(!canvas) return;
  const W=canvas.parentElement.clientWidth-2, H=210;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d'), p=chartPalette();
  const padL=8,padR=8,padT=44,padB=20, bw=W-padL-padR, bh=H-padT-padB, slot=bw/11;
  ctx.font='10px Courier,monospace';
  for(let i=0;i<11;i++){
    const s=i+2, xc=padL+(i+.5)*slot, fp=counts[s]/n*100, tp=THEORY[s], gap=Math.max(2,slot*.14);
    const fh=Math.max(2,fp/maxPct*bh), fy=padT+bh-fh;
    ctx.fillStyle=p.bar; ctx.fillRect(xc-slot/2+gap,fy,slot-2*gap,fh);
    const ty=padT+bh-tp/maxPct*bh;
    ctx.strokeStyle=p.theory; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(xc-slot/2+gap,ty); ctx.lineTo(xc+slot/2-gap,ty); ctx.stroke();
    if(counts[s]>0){
      ctx.fillStyle=p.label; ctx.textAlign='center';
      ctx.fillText(`${fp.toFixed(0)}%`,xc,fy-14);
      ctx.fillStyle=p.dim; ctx.fillText(`(${counts[s]})`,xc,fy-2);
    }
    ctx.fillStyle=p.dim; ctx.textAlign='center'; ctx.fillText(String(s),xc,H-2);
  }
  ctx.strokeStyle=p.base; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(padL,padT+bh); ctx.lineTo(W-padR,padT+bh); ctx.stroke();
  ctx.fillStyle=p.bar; ctx.fillRect(W-90,5,12,8);
  ctx.fillStyle=p.dim; ctx.textAlign='left'; ctx.fillText('факт',W-76,13);
  ctx.strokeStyle=p.theory; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(W-44,9); ctx.lineTo(W-32,9); ctx.stroke();
  ctx.fillStyle=p.dim; ctx.fillText('теория',W-30,13);
}
