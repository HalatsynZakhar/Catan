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

const PRELOAD_IMAGE_NAMES = [
  ...['Yellow', 'Blue', 'Green'].flatMap(base =>
    Array.from({ length: 6 }, (_, idx) => `${base}${idx + 1}.jpg`)
  ),
  'barbarians1_start.jpg',
  ...Array.from({ length: 7 }, (_, idx) => `barbarians${idx + 1}.jpg`),
];

const DICE_SIZE = (() => {
  const w = Math.min(window.innerWidth, 520) - 24;
  const side = Math.min(124, Math.max(78, Math.floor(w * 0.24)));
  return side;
})();

// ─── i18n ────────────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  ru: {
    page_title: 'Катан — Кубики',
    app_title: 'КАТАН',
    timer_lbl: 'ХОД',
    pause_btn: 'ПАУЗА',
    play_btn: 'ПЛЕЙ',
    event_name_initial: 'Нажмите кнопку',
    event_sub_initial: 'чтобы начать',
    alchemist_btn: 'Алхимик',
    roll_btn: 'БРОСИТЬ КУБИКИ',
    stat_btn: 'СТАТ',
    history_btn: 'ИСТ',
    history_card_title: 'Последние ходы',
    no_turns: 'Нет ходов',
    barb_off: 'Варвары: выкл',
    barb_pos: n => n === 0 ? 'Варвары: старт' : `Варвары: ${n}`,
    stats_modal_title: 'СТАТИСТИКА',
    close_btn: 'ЗАКРЫТЬ',
    no_stats: 'Нет данных по статистике',
    stat_time: 'ВРЕМЯ', stat_turns: 'ХОДОВ', stat_avg: 'СРЕДНЕЕ', stat_dev: 'ОТКЛ',
    stats_dist: 'РАСПРЕДЕЛЕНИЕ СУММ',
    stats_events: 'СОБЫТИЯ',
    tbl_event: 'СОБЫТИЕ', tbl_count: 'КОЛ', tbl_fact: 'ФАКТ%', tbl_theory: 'ТЕОР%',
    tbl_total: 'ИТОГО', stats_detail: 'ДЕТАЛЬНО ПО СУММАМ',
    tbl_sum: 'СУМ', tbl_dev: 'ОТКЛ%',
    chart_fact: 'факт', chart_theory: 'теория',
    section_lang: 'ЯЗЫК / МОВА',
    settings_modal_title: 'НАСТРОЙКИ',
    section_dice: 'РЕЖИМ КУБИКОВ',
    mode_random_title: 'Случайный',
    mode_random_desc: 'Каждый бросок независим.',
    mode_exhaust_title: 'Выбивание — 36 комбинаций',
    mode_exhaust_desc: 'Все 36 сочетаний 1+1…6+6 проходят по одному разу, затем новая колода.',
    section_events: 'РЕЖИМ СОБЫТИЙ',
    ev_random_title: 'Случайный',
    ev_random_desc: 'Каждое событие выбирается случайно.',
    ev_exhaust_title: 'Выбивание — 6 карточек',
    ev_exhaust_desc: 'Торговля, Политика, Учёность и 3 карты варваров идут по одной до нового перемешивания.',
    section_barb: 'ВАРВАРЫ',
    barb_toggle_title: 'Передвигать варваров',
    barb_toggle_desc: 'По умолчанию включено. Если отключить, остаётся текущий режим без движения варваров.',
    section_timer: 'ВРЕМЯ НА ХОД',
    time_off: 'Выкл',
    custom_time_label: 'Свое время на ход',
    custom_time_ph: 'сек',
    apply_time: 'Применить',
    section_sync: 'СИНХРОНИЗАЦИЯ',
    simultaneous_title: 'Одновременный режим',
    simultaneous_desc: 'Если устройств несколько, анимация броска запускается одновременно на всех.',
    create_sync: 'Создать код',
    leave_sync: 'Отключиться',
    join_label: 'Войти по коду игры',
    join_ph: '6 цифр',
    join_btn: 'Войти',
    section_party: 'ПАРТИЯ',
    download_log: 'Скачать лог игры',
    continue_game: 'Продолжить игру',
    new_game: 'Новая игра',
    history_modal_title: 'ИСТОРИЯ ХОДОВ',
    section_edit: 'РЕДАКТИРОВАНИЕ СОСТОЯНИЯ',
    undo_btn: 'Удалить последний ход',
    section_barb_pos: 'ТЕКУЩЕЕ ПОЛОЖЕНИЕ ВАРВАРОВ',
    section_full_history: 'ВСЯ ИСТОРИЯ',
    no_turns_yet: 'Пока нет ходов',
    alchemist_modal_title: 'АЛХИМИК',
    alchemist_note: 'Выберите значения двух кубиков. Ход выполняется стандартно, но не попадает в общую статистику и не продвигает колоду 36 комбинаций.',
    section_die1: 'ПЕРВЫЙ КУБИК',
    section_die2: 'ВТОРОЙ КУБИК',
    die2_note: 'Красный кубик, влияющий на получение карт развития.',
    apply_alchemist: 'Применить алхимика',
    ev_trade_name: 'Торговля',    ev_trade_sub: 'Ткань (Шерсть)',
    ev_politics_name: 'Политика', ev_politics_sub: 'Монеты (Руда)',
    ev_science_name: 'Учёность',  ev_science_sub: 'Бумага (Дерево)',
    ev_barbarians_name: 'Варвары!', ev_barbarians_sub: '',
    ev_barbarians_short: 'Варв',
    ev_barbarians_display: 'Варвары',
    barb_start_pos: pos => `Позиция: ${pos}`,
    barb_start_label: 'Стартовое положение',
    roll_count: n => `Ходов: ${n}`,
    deck_dice: i => `Кубики ${i}/36`,
    deck_events: i => `События ${i}/6`,
    sync_unavailable: 'Синхронизация недоступна',
    sync_waiting: 'Ожидание восстановления устройства...',
    sync_paused: 'Синхронизация приостановлена',
    sync_disconnected: 'Не подключено',
    sync_code: code => `Код игры: ${code}`,
    toast_sync_lost: 'Синхронизация потеряна. Действия временно заблокированы.',
    toast_device_back: 'Устройство восстановило соединение. Игра продолжается.',
    toast_device_lost: 'Одно из устройств пропало. Ожидание восстановления 10 сек...',
    toast_device_removed_ok: 'Устройство удалено из игры. Можно продолжать.',
    toast_device_removed: 'Устройство удалено из игры.',
    toast_devices_count: n => `Устройств в игре: ${n}`,
    toast_code_created: code => `Код игры создан: ${code}`,
    toast_joined: code => `Устройство подключено к игре ${code}`,
    toast_sync_off: 'Синхронизация отключена',
    toast_log_saved: 'Лог игры скачан',
    toast_log_loaded: 'Игра восстановлена из лога',
    toast_internet_lost: 'Интернет пропал. Действия заблокированы до восстановления синхронизации.',
    confirm_replace: 'Текущая игра будет потеряна. Продолжить?',
    confirm_load_log: 'Текущая игра будет потеряна. Загрузить игру из лог-файла?',
    confirm_new_game: 'Текущая игра будет потеряна. Начать новую игру?',
    alert_create_failed: 'Не удалось создать код игры.',
    alert_join_failed: 'Не удалось подключиться к игре по этому коду.',
    turn_alchemist: 'Алхимик',
    turn_no_stat: ' • без статистики',
    turn_elapsed: s => ` • ${s}с`,
    turn_barb: pos => ` • варвары ${pos}`,
    log_header: 'Лог игры Catan Cities & Knights',
    log_export: date => `Экспорт: ${date}`,
    log_turns: n => `Ходов: ${n}`,
    log_history: 'История:',
    log_no_turns: 'Ходов пока нет',
    log_locale: 'ru-RU',
  },
  uk: {
    page_title: 'Катан — Кубики',
    app_title: 'КАТАН',
    timer_lbl: 'ХІД',
    pause_btn: 'ПАУЗА',
    play_btn: 'ГРАТИ',
    event_name_initial: 'Натисніть кнопку',
    event_sub_initial: 'щоб почати',
    alchemist_btn: 'Алхімік',
    roll_btn: 'КИНУТИ КУБИКИ',
    stat_btn: 'СТАТ',
    history_btn: 'ІСТ',
    history_card_title: 'Останні ходи',
    no_turns: 'Немає ходів',
    barb_off: 'Варвари: вимк',
    barb_pos: n => n === 0 ? 'Варвари: старт' : `Варвари: ${n}`,
    stats_modal_title: 'СТАТИСТИКА',
    close_btn: 'ЗАКРИТИ',
    no_stats: 'Немає даних зі статистики',
    stat_time: 'ЧАС', stat_turns: 'ХОДІВ', stat_avg: 'СЕРЕДНЄ', stat_dev: 'ВІДХ',
    stats_dist: 'РОЗПОДІЛ СУМ',
    stats_events: 'ПОДІЇ',
    tbl_event: 'ПОДІЯ', tbl_count: 'К-ТЬ', tbl_fact: 'ФАКТ%', tbl_theory: 'ТЕОР%',
    tbl_total: 'РАЗОМ', stats_detail: 'ДЕТАЛЬНО ЗА СУМАМИ',
    tbl_sum: 'СУМ', tbl_dev: 'ВІДХ%',
    chart_fact: 'факт', chart_theory: 'теорія',
    section_lang: 'ЯЗЫК / МОВА',
    settings_modal_title: 'НАЛАШТУВАННЯ',
    section_dice: 'РЕЖИМ КУБИКІВ',
    mode_random_title: 'Випадковий',
    mode_random_desc: 'Кожен кидок незалежний.',
    mode_exhaust_title: 'Вибивання — 36 комбінацій',
    mode_exhaust_desc: 'Усі 36 поєднань 1+1…6+6 проходять по одному разу, потім нова колода.',
    section_events: 'РЕЖИМ ПОДІЙ',
    ev_random_title: 'Випадковий',
    ev_random_desc: 'Кожна подія вибирається випадково.',
    ev_exhaust_title: 'Вибивання — 6 карток',
    ev_exhaust_desc: 'Торгівля, Політика, Вченість і 3 карти варварів ідуть по одній до нового перемішування.',
    section_barb: 'ВАРВАРИ',
    barb_toggle_title: 'Пересувати варварів',
    barb_toggle_desc: 'За замовчуванням увімкнено. Якщо вимкнути, поточний режим залишається без руху варварів.',
    section_timer: 'ЧАС НА ХІД',
    time_off: 'Вимк',
    custom_time_label: 'Свій час на хід',
    custom_time_ph: 'сек',
    apply_time: 'Застосувати',
    section_sync: 'СИНХРОНІЗАЦІЯ',
    simultaneous_title: 'Одночасний режим',
    simultaneous_desc: 'Якщо пристроїв кілька, анімація кидка запускається одночасно на всіх.',
    create_sync: 'Створити код',
    leave_sync: 'Відключитися',
    join_label: 'Увійти за кодом гри',
    join_ph: '6 цифр',
    join_btn: 'Увійти',
    section_party: 'ПАРТІЯ',
    download_log: 'Завантажити лог гри',
    continue_game: 'Продовжити гру',
    new_game: 'Нова гра',
    history_modal_title: 'ІСТОРІЯ ХОДІВ',
    section_edit: 'РЕДАГУВАННЯ СТАНУ',
    undo_btn: 'Видалити останній хід',
    section_barb_pos: 'ПОТОЧНЕ ПОЛОЖЕННЯ ВАРВАРІВ',
    section_full_history: 'ВСЯ ІСТОРІЯ',
    no_turns_yet: 'Поки немає ходів',
    alchemist_modal_title: 'АЛХІМІК',
    alchemist_note: 'Оберіть значення двох кубиків. Хід виконується стандартно, але не потрапляє до загальної статистики і не просуває колоду 36 комбінацій.',
    section_die1: 'ПЕРШИЙ КУБИК',
    section_die2: 'ДРУГИЙ КУБИК',
    die2_note: 'Червоний кубик, що впливає на отримання карт розвитку.',
    apply_alchemist: 'Застосувати алхіміка',
    ev_trade_name: 'Торгівля',    ev_trade_sub: 'Тканина (Вовна)',
    ev_politics_name: 'Політика', ev_politics_sub: 'Монети (Руда)',
    ev_science_name: 'Вченість',  ev_science_sub: 'Папір (Дерево)',
    ev_barbarians_name: 'Варвари!', ev_barbarians_sub: '',
    ev_barbarians_short: 'Варв',
    ev_barbarians_display: 'Варвари',
    barb_start_pos: pos => `Позиція: ${pos}`,
    barb_start_label: 'Початкове положення',
    roll_count: n => `Ходів: ${n}`,
    deck_dice: i => `Кубики ${i}/36`,
    deck_events: i => `Події ${i}/6`,
    sync_unavailable: 'Синхронізація недоступна',
    sync_waiting: 'Очікування відновлення пристрою...',
    sync_paused: 'Синхронізацію призупинено',
    sync_disconnected: 'Не підключено',
    sync_code: code => `Код гри: ${code}`,
    toast_sync_lost: 'Синхронізацію втрачено. Дії тимчасово заблоковані.',
    toast_device_back: "Пристрій відновив з'єднання. Гра продовжується.",
    toast_device_lost: 'Один з пристроїв зник. Очікування відновлення 10 сек...',
    toast_device_removed_ok: 'Пристрій видалено з гри. Можна продовжувати.',
    toast_device_removed: 'Пристрій видалено з гри.',
    toast_devices_count: n => `Пристроїв у грі: ${n}`,
    toast_code_created: code => `Код гри створено: ${code}`,
    toast_joined: code => `Пристрій підключено до гри ${code}`,
    toast_sync_off: 'Синхронізацію вимкнено',
    toast_log_saved: 'Лог гри завантажено',
    toast_log_loaded: 'Гру відновлено з логу',
    toast_internet_lost: 'Інтернет зник. Дії заблоковані до відновлення синхронізації.',
    confirm_replace: 'Поточну гру буде втрачено. Продовжити?',
    confirm_load_log: 'Поточну гру буде втрачено. Завантажити гру з лог-файлу?',
    confirm_new_game: 'Поточну гру буде втрачено. Почати нову гру?',
    alert_create_failed: 'Не вдалося створити код гри.',
    alert_join_failed: 'Не вдалося підключитися до гри за цим кодом.',
    turn_alchemist: 'Алхімік',
    turn_no_stat: ' • без статистики',
    turn_elapsed: s => ` • ${s}с`,
    turn_barb: pos => ` • варвари ${pos}`,
    log_header: 'Лог гри Catan Cities & Knights',
    log_export: date => `Експорт: ${date}`,
    log_turns: n => `Ходів: ${n}`,
    log_history: 'Історія:',
    log_no_turns: 'Ходів поки немає',
    log_locale: 'uk-UA',
  },
};

function t(key, ...args) {
  const dict = TRANSLATIONS[state?.lang] ?? TRANSLATIONS.ru;
  const val = dict[key] ?? TRANSLATIONS.ru[key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

function applyTranslations() {
  document.title = t('page_title');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  // Update lang chip active state
  document.querySelectorAll('.lang-chip').forEach(btn => {
    btn.classList.toggle('lang-chip-active', btn.dataset.lang === state.lang);
  });
}

// ─────────────────────────────────────────────────────────────────────────────

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
  syncExpectedParticipants: 0,
  syncDeviceLabels: [],
  syncNetworkOk: true,
  syncRecoveryTimer: null,
  lang: localStorage.getItem('catan-lang') || 'ru',
  simultaneousMode: true,
  pendingCue: null,
  cueTimeout: null,
  lastAnimatedTurnId: '',
  clockOffsetMs: 0,
  preloadedImages: [],
  imagePreloadPromise: null,
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

function preloadImage(name) {
  return new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    img.src = imageUrl(name);

    const finalize = () => resolve(img);
    img.onload = finalize;
    img.onerror = finalize;
  });
}

function preloadEventImages() {
  if (state.imagePreloadPromise) return state.imagePreloadPromise;
  state.imagePreloadPromise = Promise.allSettled(
    PRELOAD_IMAGE_NAMES.map(preloadImage)
  ).then(results => {
    state.preloadedImages = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    return state.preloadedImages;
  });
  return state.imagePreloadPromise;
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

function startTimer(reset = true, silent = false) {
  startTimerAt(0, reset, silent);
}

function startTimerAt(anchorMs = 0, reset = true, silent = false) {
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
  if (!silent) pushStateToSync().catch(() => {});
}

function pauseTimer() {
  if (!guardStrictSyncAction()) return;
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
  if (!guardStrictSyncAction()) return;
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
  if (!guardStrictSyncAction()) return;
  state.rollMode = mode;
  state.exhaustDeck = [];
  state.exhaustIdx = 0;
  refreshSettingsUI();
  renderCounters();
  ensureAllSettingsSynced();
}

function setEventMode(mode) {
  if (!guardStrictSyncAction()) return;
  state.eventMode = mode;
  state.eventDeck = [];
  state.eventIdx = 0;
  refreshSettingsUI();
  renderCounters();
  ensureAllSettingsSynced();
}

function setTimeLimit(secs) {
  if (!guardStrictSyncAction()) return;
  state.timeLimit = Math.max(0, secs || 0);
  finishTurnTimer();
  refreshSettingsUI();
  ensureAllSettingsSynced();
}

function setBarbarianTracking(enabled) {
  if (!guardStrictSyncAction()) return;
  state.barbarianTracking = enabled;
  refreshSettingsUI();
  renderHistory();
  if (!state.turns.length) {
    renderStartEventState();
  } else {
    state.lastEventView = makeEventView(state.turns[state.turns.length - 1]);
    renderEventState(state.lastEventView);
  }
  ensureAllSettingsSynced();
}

function setSimultaneousMode(enabled) {
  if (!guardStrictSyncAction()) return;
  state.simultaneousMode = enabled;
  refreshSettingsUI();
  ensureAllSettingsSynced();
}

function setBarbarianPosition(position) {
  if (!guardStrictSyncAction()) return;
  state.barbarianPosition = position;
  renderHistory();
  if (!state.turns.length) {
    renderStartEventState();
  } else if (state.lastEventView && state.lastEventView.eventKey === 'barbarians' && state.barbarianTracking) {
    state.lastEventView.image = imageUrl(`barbarians${position}.jpg`);
    renderEventState(state.lastEventView);
  }
  renderHistoryModal();
  ensureAllSettingsSynced();
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
  if (!syncAvailable()) return t('sync_unavailable');
  if (state.syncRecoveryTimer !== null) return t('sync_waiting');
  if (isStrictSyncBlocked()) return t('sync_paused');
  if (!state.syncConnected) return t('sync_disconnected');
  return t('sync_code', state.syncCode);
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
    banner.classList.toggle('sync-banner-hidden', !state.syncConnected || state.syncParticipantCount <= 1);
  }
}

function ensureAllSettingsSynced() {
  if (!state.syncConnected) return;
  pushStateToSync(true).catch(() => {});
}

function isStrictSyncBlocked() {
  if (!state.syncConnected) return false;
  if (state.syncExpectedParticipants <= 1) return false;
  if (!state.syncNetworkOk) return true;
  return state.syncParticipantCount < state.syncExpectedParticipants;
}

function updateStrictSyncUiState() {
  const blocked = isStrictSyncBlocked();
  const rollBtn = document.getElementById('roll-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const playBtn = document.getElementById('play-btn');
  if (rollBtn && !state.locked) rollBtn.disabled = blocked;
  if (pauseBtn) pauseBtn.disabled = blocked;
  if (playBtn) playBtn.disabled = blocked;
}

function guardStrictSyncAction() {
  if (!isStrictSyncBlocked()) return true;
  showToast(t('toast_sync_lost'));
  return false;
}

function updateSyncPresence(count, labels = [], serverExpected = 0) {
  const prev = state.syncParticipantCount;
  state.syncParticipantCount = Number(count || 0);
  state.syncDeviceLabels = Array.isArray(labels) ? labels : [];
  state.syncNetworkOk = true;

  let specificToast = false;

  // Device came back during grace period — cancel timer
  if (state.syncRecoveryTimer !== null && state.syncParticipantCount >= state.syncExpectedParticipants) {
    clearTimeout(state.syncRecoveryTimer);
    state.syncRecoveryTimer = null;
    if (state.syncConnected) {
      showToast(t('toast_device_back'));
      specificToast = true;
    }
  }

  // Sync expected from server only upward: restores after page refresh, detects new joins.
  // Never decrease here — only the 10s timer decreases it (then pushes the new value to server).
  state.syncExpectedParticipants = Math.max(
    state.syncExpectedParticipants,
    state.syncParticipantCount,
    Number(serverExpected) || 0,
  );

  // Start 10-second grace period if a peer went missing
  if (state.syncConnected
    && state.syncExpectedParticipants > 1
    && state.syncParticipantCount < state.syncExpectedParticipants
    && state.syncRecoveryTimer === null) {
    showToast(t('toast_device_lost'));
    specificToast = true;
    state.syncRecoveryTimer = setTimeout(() => {
      state.syncRecoveryTimer = null;
      state.syncExpectedParticipants = state.syncParticipantCount;
      if (state.syncNetworkOk) {
        showToast(t('toast_device_removed_ok'));
      } else {
        showToast(t('toast_device_removed'));
      }
      renderSyncUI();
      updateStrictSyncUiState();
      // Push the decreased expectedParticipants to server so other clients and
      // page refreshes see the updated value immediately.
      pushStateToSync(true).catch(() => {});
    }, 10_000);
  }

  // Generic count-change toast only when no specific toast was shown
  if (!specificToast && state.syncConnected && prev > 0 && state.syncParticipantCount !== prev) {
    showToast(t('toast_devices_count', state.syncParticipantCount));
  }

  renderSyncUI();
  updateStrictSyncUiState();
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
  renderSyncUI();
  updateStrictSyncUiState();

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
      expectedParticipants: state.syncExpectedParticipants,
    };
    const data = await apiFetch(`/sessions/${state.syncCode}/state`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    state.syncRevision = data.revision;
    state.syncNetworkOk = true;
    updateSyncPresence(data.participantCount, data.deviceLabels, data.expectedParticipants);
  } catch (error) {
    state.syncNetworkOk = false;
    renderSyncUI();
    updateStrictSyncUiState();
    if (String(error.message) === 'revision-conflict') {
      await pullStateFromSync();
    }
  } finally {
    state.syncBusy = false;
  }
}

async function pullStateFromSync() {
  if (!state.syncConnected || !state.syncCode) return;
  let data;
  try {
    data = await apiFetch(`/sessions/${state.syncCode}?revision=${state.syncRevision}&deviceId=${encodeURIComponent(state.deviceId)}`);
    state.syncNetworkOk = true;
  } catch (error) {
    state.syncNetworkOk = false;
    renderSyncUI();
    updateStrictSyncUiState();
    throw error;
  }
  if (!data) return;
  updateSyncPresence(data.participantCount, data.deviceLabels, data.expectedParticipants);
  if (typeof data.revision === 'number' && data.revision >= state.syncRevision) {
    const hasNewState = data.changed !== false && data.revision > state.syncRevision;
    state.syncRevision = data.revision;
    if (hasNewState && data.gameState) hydrateState(data.gameState);
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
  state.syncNetworkOk = true;
  state.syncExpectedParticipants = Math.max(1, Number(data.expectedParticipants || data.participantCount || 1));
  updateSyncPresence(data.participantCount, data.deviceLabels, data.expectedParticipants);
  startSyncPolling();
  showToast(t('toast_code_created', data.code));
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
  state.syncNetworkOk = true;
  state.syncExpectedParticipants = Math.max(1, Number(data.expectedParticipants || data.participantCount || 1));
  if (data.gameState) hydrateState(data.gameState);
  updateSyncPresence(data.participantCount, data.deviceLabels, data.expectedParticipants);
  startSyncPolling();
  showToast(t('toast_joined', normalized));
  document.getElementById('join-code-input').value = normalized;
}

function leaveSyncSession() {
  stopSyncPolling();
  if (state.syncRecoveryTimer !== null) {
    clearTimeout(state.syncRecoveryTimer);
    state.syncRecoveryTimer = null;
  }
  state.syncCode = '';
  state.syncRevision = 0;
  state.syncConnected = false;
  state.syncParticipantCount = 0;
  state.syncExpectedParticipants = 0;
  state.syncDeviceLabels = [];
  state.syncNetworkOk = true;
  document.getElementById('join-code-input').value = '';
  renderSyncUI();
  updateStrictSyncUiState();
  showToast(t('toast_sync_off'));
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
  const label = turn.alchemist ? t('turn_alchemist') : `#${turn.number}`;
  const eventLabel = turn.eventKey === 'barbarians'
    ? t('ev_barbarians_name')
    : `${t('ev_' + turn.eventKey + '_name')} (${turn.d2})`;
  const counted = turn.counted ? '' : t('turn_no_stat');
  const think = turn.elapsed !== null ? t('turn_elapsed', turn.elapsed) : '';
  const barb = turn.barbarianPositionAfter > 0 && state.barbarianTracking
    ? t('turn_barb', turn.barbarianPositionAfter)
    : '';
  return `${label} • ${eventLabel} • ${turn.d1}+${turn.d2}=${turn.total}${think}${counted}${barb}`;
}

function hasMeaningfulGameState() {
  return state.turns.length > 0
    || state.timeLimit !== 0
    || state.rollMode !== 'random'
    || state.eventMode !== 'random'
    || state.barbarianTracking !== true
    || state.barbarianPosition !== 0
    || state.timerStarted
    || state.timerRunning
    || state.timerPaused;
}

function confirmReplacingCurrentGame(message = null) {
  message = message ?? t('confirm_replace');
  if (!hasMeaningfulGameState()) return true;
  return window.confirm(message);
}

function buildGameLogText() {
  const exportPayload = {
    app: 'catan-dice',
    version: 1,
    exportedAt: new Date().toISOString(),
    gameCode: state.syncCode || '',
    state: serializeState(),
  };
  const historyLines = state.turns.length
    ? state.turns.map(turn => turnDescription(turn))
    : [t('log_no_turns')];
  return [
    t('log_header'),
    t('log_export', new Date().toLocaleString(t('log_locale'))),
    t('log_turns', state.turns.length),
    '',
    t('log_history'),
    ...historyLines,
    '',
    '--- SNAPSHOT ---',
    JSON.stringify(exportPayload, null, 2),
    '',
  ].join('\n');
}

function downloadGameLog() {
  const blob = new Blob([buildGameLogText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'log.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(t('toast_log_saved'));
}

function extractImportedState(text) {
  const marker = '--- SNAPSHOT ---';
  const raw = text.includes(marker) ? text.slice(text.indexOf(marker) + marker.length).trim() : text.trim();
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === 'object') {
    if (parsed.state && typeof parsed.state === 'object') return parsed.state;
    if (parsed.gameState && typeof parsed.gameState === 'object') return parsed.gameState;
    return parsed;
  }
  throw new Error('invalid-log');
}

async function importGameLog(file) {
  if (!guardStrictSyncAction()) return;
  const text = await file.text();
  const importedState = extractImportedState(text);
  hydrateState(importedState);
  pushStateToSync(true).catch(() => {});
  showToast(t('toast_log_loaded'));
}

function renderHistory() {
  const recentTurnsEl = document.getElementById('recent-turns');
  const recent = [...state.turns].slice(-3).reverse();
  recentTurnsEl.innerHTML = recent.length
    ? recent.map(turn => {
      const event = EVENT_DEFS[turn.eventKey];
      const eventLabel = turn.eventKey === 'barbarians'
        ? t('ev_barbarians_short')
        : `${t('ev_' + turn.eventKey + '_name').slice(0, 4)} (${turn.d2})`;
      return `<div class="recent-turn-chip">
        <div class="recent-turn-top">#${turn.number} ${turn.d1}+${turn.d2}</div>
        <div class="recent-turn-bottom">${eventLabel}</div>
      </div>`;
    }).join('')
    : `<div class="no-data">${t('no_turns')}</div>`;
  const barbMeta = state.barbarianTracking
    ? t('barb_pos', state.barbarianPosition)
    : t('barb_off');
  document.getElementById('history-meta').textContent = barbMeta;
}

function renderHistoryModal() {
  renderBarbarianPositionGrid();
  const fullHistory = document.getElementById('full-history');
  if (state.turns.length === 0) {
    fullHistory.innerHTML = `<div class="no-data">${t('no_turns_yet')}</div>`;
    return;
  }
  fullHistory.innerHTML = [...state.turns]
    .reverse()
    .map(turn => `<div class="full-history-item ${turn.counted ? '' : 'dimmed'}">${turnDescription(turn)}</div>`)
    .join('');
}

function renderRollCount() {
  document.getElementById('roll-count').textContent = t('roll_count', state.turns.length);
}

function renderCounters(lastTurn = null) {
  const headerParts = [];
  if (state.rollMode === 'exhaust') headerParts.push(t('deck_dice', state.exhaustIdx));
  if (state.eventMode === 'exhaust') headerParts.push(t('deck_events', state.eventIdx));
  document.getElementById('deck-counter').innerHTML = headerParts.length ? headerParts.join(' · ') : '&nbsp;';
}

function makeEventView(turn) {
  const event = EVENT_DEFS[turn.eventKey];
  const isBarbarians = turn.eventKey === 'barbarians';
  let img = '';
  if (isBarbarians) {
    if (state.barbarianTracking) {
      img = imageUrl(`barbarians${turn.barbarianPositionAfter}.jpg`);
    } else {
      img = imageUrl('barbarians.svg');
    }
  } else {
    img = imageUrl(`${event.imgBase}${turn.d2}.jpg`);
  }

  return {
    eventKey: turn.eventKey,
    name: isBarbarians ? t('ev_barbarians_name') : `${t('ev_' + turn.eventKey + '_name')} (${turn.d2})`,
    sub: t('ev_' + turn.eventKey + '_sub') || '\u00A0',
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
      ? imageUrl(`barbarians${state.barbarianPosition}.jpg`)
      : imageUrl('barbarians1_start.jpg');
    imgEl.classList.add('shown');
    document.getElementById('event-placeholder').classList.add('hidden');
    document.getElementById('event-name').textContent = t('ev_barbarians_display');
    document.getElementById('event-sub').textContent = state.barbarianPosition > 0 ? t('barb_start_pos', state.barbarianPosition) : t('barb_start_label');
    document.getElementById('event-name').style.color = uiColor;
    document.getElementById('event-sub').style.color = uiColor;
    document.getElementById('event-section').style.borderColor = EVENT_DEFS.barbarians.color;
    document.getElementById('event-section').style.boxShadow = `0 0 20px ${EVENT_DEFS.barbarians.color}33`;
    document.getElementById('event-caption').style.borderTopColor = EVENT_DEFS.barbarians.color;
  } else {
    imgEl.removeAttribute('src');
    imgEl.classList.remove('shown');
    document.getElementById('event-placeholder').classList.remove('hidden');
    document.getElementById('event-name').textContent = t('event_name_initial');
    document.getElementById('event-sub').textContent = t('event_sub_initial');
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
    const timerAnchor = activeCue && activeCue.timerStartAt ? activeCue.timerStartAt : syncedNow();
    if (state.pendingCue && state.pendingCue.turnId === turn.id) {
      state.pendingCue = null;
    }
    startTimerAt(timerAnchor, true, true);
    rerenderAfterStateChange(turn);
    document.getElementById('roll-btn').disabled = false;
    state.locked = false;
  }, 660);
}

function applyTurn(turn) {
  state.turns.push(turn);
  playTurnAnimation(turn);
}

function roll(options = {}) {
  if (!guardStrictSyncAction()) return;
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
  if (!guardStrictSyncAction()) return;
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
  if (!guardStrictSyncAction()) return;
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
    body.innerHTML = `<div class="no-data">${t('no_stats')}</div>`;
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
      <div class="stat-cell"><div class="stat-label">${t('stat_time')}</div><div class="stat-val">${Math.floor(totalThink / 60)}:${String(totalThink % 60).padStart(2, '0')}</div></div>
      <div class="stat-cell"><div class="stat-label">${t('stat_turns')}</div><div class="stat-val">${n}</div></div>
      <div class="stat-cell"><div class="stat-label">${t('stat_avg')}</div><div class="stat-val">${avg.toFixed(1)}</div></div>
      <div class="stat-cell"><div class="stat-label">${t('stat_dev')}</div><div class="stat-val" style="color:${diffCol}">${sign}${diff.toFixed(1)}</div></div>
    </div>
    <div class="stats-section-label">${t('stats_dist')}</div>
    <div class="chart-wrap"><canvas id="stats-chart"></canvas></div>
    <div class="stats-section-label">${t('stats_events')}</div>
    <div class="tbl-events">
      <div class="tbl-head"><span>${t('tbl_event')}</span><span>${t('tbl_count')}</span><span>${t('tbl_fact')}</span><span>${t('tbl_theory')}</span></div>
      ${eventsRows()}
      <div class="tbl-sep"></div>
      <div class="tbl-total"><span>${t('tbl_total')}</span><span>${n}</span></div>
    </div>
    <div class="stats-section-label">${t('stats_detail')}</div>
    <div class="tbl-detail">
      <div class="tbl-head"><span>${t('tbl_sum')}</span><span>${t('tbl_count')}</span><span>${t('tbl_fact')}</span><span>${t('tbl_theory')}</span><span>${t('tbl_dev')}</span></div>
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
      <span style="color:${color}">${t('ev_' + key + '_name')}</span>
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
  ctx.fillText(t('chart_fact'), W - 76, 13);

  ctx.strokeStyle = p.theory;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W - 44, 9);
  ctx.lineTo(W - 32, 9);
  ctx.stroke();
  ctx.fillStyle = p.dim;
  ctx.fillText(t('chart_theory'), W - 30, 13);
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
  preloadEventImages().catch(() => {});

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
      window.alert(t('alert_create_failed'));
    }
  });
  document.getElementById('join-sync-btn').addEventListener('click', async () => {
    const code = document.getElementById('join-code-input').value;
    if (!confirmReplacingCurrentGame(t('confirm_replace'))) return;
    try {
      await joinSyncSession(code);
    } catch (error) {
      window.alert(t('alert_join_failed'));
    }
  });
  document.getElementById('leave-sync-btn').addEventListener('click', leaveSyncSession);
  document.getElementById('download-log-btn').addEventListener('click', downloadGameLog);
  document.getElementById('continue-game-btn').addEventListener('click', () => {
    if (!confirmReplacingCurrentGame(t('confirm_load_log'))) return;
    document.getElementById('continue-game-input').click();
  });
  document.getElementById('continue-game-input').addEventListener('change', async e => {
    const [file] = e.target.files || [];
    e.target.value = '';
    if (!file) return;
    try {
      await importGameLog(file);
    } catch (error) {
      window.alert(t('alert_join_failed'));
    }
  });
  document.getElementById('new-game-btn').addEventListener('click', () => {
    if (!confirmReplacingCurrentGame(t('confirm_new_game'))) return;
    resetGame();
  });
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

  // Language switcher
  document.querySelectorAll('.lang-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      localStorage.setItem('catan-lang', state.lang);
      applyTranslations();
      renderRollCount();
      renderCounters();
      renderHistory();
      if (state.lastEventView) renderEventState(state.lastEventView);
      else renderStartEventState();
      renderSyncUI();
      if (!document.getElementById('stats-modal').classList.contains('modal-hidden')) renderStats();
      if (!document.getElementById('history-modal').classList.contains('modal-hidden')) renderHistoryModal();
    });
  });

  applyTranslations();
  renderAlchemySelectors();
  refreshSettingsUI();
  renderRollCount();
  renderCounters();
  renderHistory();
  renderStartEventState();
  updateTimerDisplay();
  setTimerStyle();
  renderSyncUI();
  updateStrictSyncUiState();
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

  window.addEventListener('offline', () => {
    state.syncNetworkOk = false;
    renderSyncUI();
    updateStrictSyncUiState();
    if (state.syncConnected && state.syncExpectedParticipants > 1) {
      showToast(t('toast_internet_lost'));
    }
  });

  window.addEventListener('online', () => {
    state.syncNetworkOk = true;
    renderSyncUI();
    updateStrictSyncUiState();
    if (state.syncConnected) {
      pullStateFromSync().catch(() => {});
    }
  });

  init();
