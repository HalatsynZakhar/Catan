import tkinter as tk
from tkinter import font as tkfont
import random

# ── Палитра ───────────────────────────────────────────────────────────────────
BG      = "#0D0D14"
PANEL   = "#13131F"
BORDER  = "#2A2A40"
GOLD    = "#E8C97A"
BLUE    = "#7A9FE8"
GREEN   = "#7AE8A3"
RED     = "#E87A7A"
DIM     = "#5A5A7A"
WHITE   = "#EEEEFF"
BTN     = "#C45F3A"
BTN_HOV = "#E87A50"

EVENTS = [
    ("Жёлтая овца",    "ткань",  GOLD),
    ("Синий камень",   "монеты", BLUE),
    ("Зелёная бумага", "дерево", GREEN),
    ("Варвары!",       "",       RED),
    ("Варвары!",       "",       RED),
    ("Варвары!",       "",       RED),
]

DOT_POS = {
    1: [(50, 50)],
    2: [(28, 28), (72, 72)],
    3: [(28, 28), (50, 50), (72, 72)],
    4: [(28, 28), (72, 28), (28, 72), (72, 72)],
    5: [(28, 28), (72, 28), (50, 50), (28, 72), (72, 72)],
    6: [(28, 24), (72, 24), (28, 50), (72, 50), (28, 76), (72, 76)],
}

# Теоретические вероятности суммы двух d6 (в %)
THEORY = {
    2:  2.78, 3:  5.56, 4:  8.33, 5: 11.11, 6: 13.89,
    7: 16.67, 8: 13.89, 9: 11.11, 10: 8.33, 11: 5.56, 12: 2.78
}

DICE_SIZE = 185


class Die(tk.Canvas):
    def __init__(self, parent, size=DICE_SIZE, highlight=False, **kw):
        super().__init__(parent, width=size, height=size,
                         bg=BG, highlightthickness=0, **kw)
        self.size = size
        self.color = GOLD
        self.highlight = highlight
        self.value = 1
        self._step = 0
        self._job = None
        self._draw(1)

    def _rounded_rect(self, x0, y0, x1, y1, r, **kw):
        pts = [x0+r, y0, x1-r, y0, x1, y0, x1, y0+r,
               x1, y1-r, x1, y1, x1-r, y1, x0+r, y1,
               x0, y1, x0, y1-r, x0, y0+r, x0, y0, x0+r, y0]
        return self.create_polygon(pts, smooth=True, **kw)

    def _draw(self, val, ox=0, oy=0):
        self.delete("all")
        s = self.size
        pad = 8
        x0, y0 = pad+ox, pad+oy
        x1, y1 = s-pad+ox, s-pad+oy
        r = 18
        dot_c  = WHITE if self.highlight else self.color
        bord_c = WHITE if self.highlight else self.color
        bord_w = 3     if self.highlight else 2
        self._rounded_rect(x0+5, y0+5, x1+5, y1+5, r, fill="#050510", outline="")
        self._rounded_rect(x0, y0, x1, y1, r, fill="#1A1A2E",
                           outline=bord_c, width=bord_w)
        dr = max(9, s // 15)
        for px, py in DOT_POS.get(val, []):
            cx = x0 + (x1-x0) * px / 100
            cy = y0 + (y1-y0) * py / 100
            self.create_oval(cx-dr, cy-dr, cx+dr, cy+dr, fill=dot_c, outline="")

    def roll(self, final_value, color):
        if self._job:
            self.after_cancel(self._job)
        self.color = color
        self.value = final_value
        self._step = 0
        self._shake()

    def _shake(self):
        total = 16
        s = self._step
        if s < total:
            amp = max(1, 9 - s)
            v = self.value if s == total-1 else random.randint(1, 6)
            self._draw(v, random.randint(-amp, amp), random.randint(-amp, amp))
            self._step += 1
            self._job = self.after(35, self._shake)
        else:
            self._draw(self.value)


# ── Окно статистики ───────────────────────────────────────────────────────────
class StatsWindow(tk.Toplevel):
    def __init__(self, parent, sums, total_seconds, ev_counts):
        super().__init__(parent)
        self.title("Статистика")
        self.configure(bg=BG)
        self.resizable(False, False)

        sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
        self.geometry(f"{sw}x{sh}+0+0")

        self._sums      = sums
        self._total_sec = total_seconds
        self._ev_counts = ev_counts
        self._build(sw, sh)

    def _build(self, W, H):
        fT = tkfont.Font(family="Courier", size=13, weight="bold")
        fL = tkfont.Font(family="Courier", size=8,  weight="bold")
        fV = tkfont.Font(family="Courier", size=16, weight="bold")
        fS = tkfont.Font(family="Courier", size=9)
        fB = tkfont.Font(family="Courier", size=13, weight="bold")

        # ── Шапка (фиксированная, вне скролла)
        hdr = tk.Frame(self, bg=BG)
        hdr.pack(fill=tk.X, padx=10, pady=(4,0))
        tk.Label(hdr, text="СТАТИСТИКА", font=fT, bg=BG, fg=WHITE).pack(side=tk.LEFT)
        tk.Button(hdr, text="X", font=fT, bg=BG, fg=DIM,
                  activebackground=BG, activeforeground=RED,
                  relief=tk.FLAT, bd=0, command=self.destroy).pack(side=tk.RIGHT)
        tk.Frame(self, bg=BORDER, height=1).pack(fill=tk.X, padx=10, pady=(2,0))

        # ── Скроллируемая область
        outer = tk.Frame(self, bg=BG)
        outer.pack(fill=tk.BOTH, expand=True)
        scr_canvas = tk.Canvas(outer, bg=BG, highlightthickness=0)
        sb = tk.Scrollbar(outer, orient="vertical", command=scr_canvas.yview)
        scr_canvas.configure(yscrollcommand=sb.set)
        sb.pack(side=tk.RIGHT, fill=tk.Y)
        scr_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        wrap = tk.Frame(scr_canvas, bg=BG)
        wid = scr_canvas.create_window((0,0), window=wrap, anchor="nw")
        scr_canvas.bind("<Configure>", lambda e: scr_canvas.itemconfig(wid, width=e.width))
        wrap.bind("<Configure>", lambda e: scr_canvas.configure(scrollregion=scr_canvas.bbox("all")))
        scr_canvas.bind_all("<MouseWheel>", lambda e: scr_canvas.yview_scroll(int(-1*(e.delta/120)), "units"))

        P = 10
        inner = tk.Frame(wrap, bg=BG)
        inner.pack(fill=tk.BOTH, expand=True, padx=P, pady=6)

        n = len(self._sums)

        # ── Строка: время + броски + среднее + откл
        r1 = tk.Frame(inner, bg=PANEL, highlightbackground=BORDER, highlightthickness=1)
        r1.pack(fill=tk.X, pady=(0, 6))
        for i in range(4): r1.columnconfigure(i, weight=1)
        mins = self._total_sec // 60
        secs = self._total_sec % 60

        def cell(parent, col, label, value, color=WHITE):
            f = tk.Frame(parent, bg=PANEL)
            f.grid(row=0, column=col, sticky="nsew", padx=6, pady=5)
            tk.Label(f, text=label, font=fL, bg=PANEL, fg=DIM).pack(anchor="w")
            tk.Label(f, text=value, font=fV, bg=PANEL, fg=color).pack(anchor="w")

        cell(r1, 0, "ВРЕМЯ", f"{mins}:{secs:02d}")
        cell(r1, 1, "БРОСКОВ", str(n))
        if n > 0:
            avg  = sum(self._sums) / n
            diff = avg - 7.0
            dcol = GREEN if abs(diff) < 0.5 else (GOLD if abs(diff) < 1.5 else RED)
            sign = "+" if diff >= 0 else ""
            cell(r1, 2, "СРЕДНЕЕ", f"{avg:.1f}")
            cell(r1, 3, "ОТКЛ", f"{sign}{diff:.1f}", dcol)
        else:
            tk.Label(inner, text="Нет данных", font=fV, bg=BG, fg=DIM).pack(pady=20)
            return

        # ── График
        tk.Label(inner, text="РАСПРЕДЕЛЕНИЕ СУММ", font=fL,
                 bg=BG, fg=DIM).pack(anchor="w", pady=(2,2))
        cf = tk.Frame(inner, bg=PANEL, highlightbackground=BORDER, highlightthickness=1)
        cf.pack(fill=tk.X)
        chart_h = 220
        chart_w = W - 20
        ch = tk.Canvas(cf, bg=PANEL, height=chart_h, width=chart_w, highlightthickness=0)
        ch.pack()
        self._draw_chart(ch, chart_w, chart_h)

        # ── Таблица событий
        tk.Label(inner, text="СОБЫТИЯ", font=fL,
                 bg=BG, fg=DIM).pack(anchor="w", pady=(8,2))
        ef = tk.Frame(inner, bg=PANEL, highlightbackground=BORDER, highlightthickness=1)
        ef.pack(fill=tk.X)
        total_ev = sum(v[0] for v in self._ev_counts.values()) or 1
        theory_ev = {"Варвары!": 50.0, "Жёлтая овца": 16.7,
                     "Синий камень": 16.7, "Зелёная бумага": 16.7}
        hrow = tk.Frame(ef, bg=PANEL)
        hrow.pack(fill=tk.X, padx=8, pady=(4,2))
        for txt, w_ in [("СОБЫТИЕ",13),("КОЛ",5),("ФАКТ%",6),("ТЕОР%",6)]:
            tk.Label(hrow, text=txt, font=fL, bg=PANEL, fg=DIM,
                     width=w_, anchor="w").pack(side=tk.LEFT)
        tk.Frame(ef, bg=BORDER, height=1).pack(fill=tk.X, padx=8)
        for name, (cnt, color) in self._ev_counts.items():
            pct = cnt / total_ev * 100
            th  = theory_ev.get(name, 0)
            rf = tk.Frame(ef, bg=PANEL)
            rf.pack(fill=tk.X, padx=8, pady=2)
            tk.Label(rf, text=name,          font=fS, bg=PANEL, fg=color, width=13, anchor="w").pack(side=tk.LEFT)
            tk.Label(rf, text=str(cnt),      font=fS, bg=PANEL, fg=WHITE, width=5,  anchor="w").pack(side=tk.LEFT)
            tk.Label(rf, text=f"{pct:.0f}%", font=fS, bg=PANEL, fg=color, width=6,  anchor="w").pack(side=tk.LEFT)
            tk.Label(rf, text=f"{th:.0f}%",  font=fS, bg=PANEL, fg=DIM,   width=6,  anchor="w").pack(side=tk.LEFT)
        tk.Frame(ef, bg=BORDER, height=1).pack(fill=tk.X, padx=8)
        tot = tk.Frame(ef, bg=PANEL)
        tot.pack(fill=tk.X, padx=8, pady=(2,4))
        tk.Label(tot, text="ИТОГО", font=fL, bg=PANEL, fg=DIM, width=13, anchor="w").pack(side=tk.LEFT)
        tk.Label(tot, text=str(total_ev), font=fL, bg=PANEL, fg=WHITE, anchor="w").pack(side=tk.LEFT)

        # ── Детальная таблица по каждой сумме
        tk.Label(inner, text="ДЕТАЛЬНО ПО СУММАМ", font=fL,
                 bg=BG, fg=DIM).pack(anchor="w", pady=(8,2))
        dt = tk.Frame(inner, bg=PANEL, highlightbackground=BORDER, highlightthickness=1)
        dt.pack(fill=tk.X)
        counts = {s: 0 for s in range(2, 13)}
        for s in self._sums:
            if s in counts: counts[s] += 1
        dh = tk.Frame(dt, bg=PANEL)
        dh.pack(fill=tk.X, padx=8, pady=(4,2))
        for txt, w_ in [("СУММА",6),("КОЛ-ВО",7),("ФАКТ%",7),("ТЕОР%",7),("ОТКЛ%",7)]:
            tk.Label(dh, text=txt, font=fL, bg=PANEL, fg=DIM,
                     width=w_, anchor="w").pack(side=tk.LEFT)
        tk.Frame(dt, bg=BORDER, height=1).pack(fill=tk.X, padx=8)
        for s in range(2, 13):
            fp  = counts[s] / n * 100
            tp  = THEORY[s]
            dev = fp - tp
            dcol2 = GREEN if abs(dev) < 3 else (GOLD if abs(dev) < 6 else RED)
            sign2 = "+" if dev >= 0 else ""
            dr = tk.Frame(dt, bg=PANEL)
            dr.pack(fill=tk.X, padx=8, pady=1)
            tk.Label(dr, text=str(s),          font=fS, bg=PANEL, fg=WHITE, width=6,  anchor="w").pack(side=tk.LEFT)
            tk.Label(dr, text=str(counts[s]),  font=fS, bg=PANEL, fg=WHITE, width=7,  anchor="w").pack(side=tk.LEFT)
            tk.Label(dr, text=f"{fp:.1f}%",    font=fS, bg=PANEL, fg=WHITE, width=7,  anchor="w").pack(side=tk.LEFT)
            tk.Label(dr, text=f"{tp:.1f}%",    font=fS, bg=PANEL, fg=DIM,   width=7,  anchor="w").pack(side=tk.LEFT)
            tk.Label(dr, text=f"{sign2}{dev:.1f}%", font=fS, bg=PANEL, fg=dcol2, width=7, anchor="w").pack(side=tk.LEFT)
        tk.Frame(inner, bg=BG, height=8).pack()

        # ── Кнопка закрыть (фиксированная внизу вне скролла)
        tk.Button(self, text="ЗАКРЫТЬ", font=fB, bg=BORDER, fg=WHITE,
                  activebackground=DIM, activeforeground=WHITE,
                  relief=tk.FLAT, bd=0, pady=12,
                  command=self.destroy).pack(fill=tk.X, padx=0, side=tk.BOTTOM)

    def _draw_chart(self, canvas, w, h):
        n   = len(self._sums)
        fS  = tkfont.Font(family="Courier", size=8)
        # много места сверху для подписей, снизу для цифр
        pad_l, pad_r, pad_t, pad_b = 10, 10, 40, 18
        bw  = w - pad_l - pad_r
        bh  = h - pad_t - pad_b

        counts = {s: 0 for s in range(2, 13)}
        for s in self._sums:
            if s in counts: counts[s] += 1
        fact = {s: counts[s] / n * 100 for s in range(2, 13)}
        max_pct = max(max(fact.values()), max(THEORY.values())) * 1.15

        num = 11
        bar_slot = bw / num

        for i, s in enumerate(range(2, 13)):
            xc  = pad_l + (i + 0.5) * bar_slot
            fp  = fact[s]
            tp  = THEORY[s]
            gap = max(3, bar_slot * 0.15)

            # ── Столбик факта — всегда синий
            fh  = max(2, fp / max_pct * bh)
            fy  = pad_t + bh - fh
            canvas.create_rectangle(
                xc - bar_slot/2 + gap, fy,
                xc + bar_slot/2 - gap, pad_t + bh,
                fill=BLUE, outline="")

            # ── Красная жирная линия теории
            th = tp / max_pct * bh
            ty = pad_t + bh - th
            canvas.create_line(
                xc - bar_slot/2 + gap, ty,
                xc + bar_slot/2 - gap, ty,
                fill=RED, width=3)

            # ── % над столбиком (только если есть броски)
            if counts[s] > 0:
                # % белым выше
                canvas.create_text(xc, fy - 15, text=f"{fp:.0f}%",
                                   fill=WHITE, font=fS, anchor="s")
                # (кол) серым ниже
                canvas.create_text(xc, fy - 3,  text=f"({counts[s]})",
                                   fill=DIM, font=fS, anchor="s")

            # ── Цифра снизу
            canvas.create_text(xc, h - 2, text=str(s),
                               fill=DIM, font=fS, anchor="s")

        # Нулевая линия
        canvas.create_line(pad_l, pad_t + bh, w - pad_r, pad_t + bh,
                           fill=BORDER, width=1)
        # Легенда справа вверху
        canvas.create_rectangle(w-88, 4, w-76, 12, fill=BLUE, outline="")
        canvas.create_text(w-74, 8, text="факт", fill=DIM, font=fS, anchor="w")
        canvas.create_line(w-42, 8, w-30, 8, fill=RED, width=3)
        canvas.create_text(w-28, 8, text="теория", fill=DIM, font=fS, anchor="w")


# ── Главное приложение ────────────────────────────────────────────────────────
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Катан")
        self.configure(bg=BG)
        self.resizable(False, False)

        sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
        w, h = min(420, sw), min(860, sh)
        self.geometry(f"{w}x{h}+{(sw-w)//2}+{(sh-h)//2}")

        self._count        = 0
        self._history      = []
        self._timer_running = False
        self._timer_seconds = 0
        self._timer_job    = None
        self._sums         = []
        self._total_think  = 0
        # счётчик событий
        self._ev_counts = {name: [0, color] for name, _, color in EVENTS
                           if name not in {n for n, *_ in EVENTS[:EVENTS.index((name, _, color))]}}
        seen = set()
        self._ev_counts = {}
        for name, _, color in EVENTS:
            if name not in seen:
                self._ev_counts[name] = [0, color]
                seen.add(name)
        self._build()

    def _build(self):
        P = 12
        fh      = tkfont.Font(family="Courier", size=13, weight="bold")
        fe      = tkfont.Font(family="Courier", size=10)
        f_event = tkfont.Font(family="Courier", size=14, weight="bold")
        f_sub   = tkfont.Font(family="Courier", size=12)
        f_label = tkfont.Font(family="Courier", size=9,  weight="bold")
        f_sum   = tkfont.Font(family="Courier", size=72, weight="bold")
        f_sum_s = tkfont.Font(family="Courier", size=11)
        f_btn   = tkfont.Font(family="Courier", size=15, weight="bold")
        f_btn_s = tkfont.Font(family="Courier", size=11, weight="bold")
        f_hist  = tkfont.Font(family="Courier", size=10)
        f_timer = tkfont.Font(family="Courier", size=10)

        wrap = tk.Frame(self, bg=BG)
        wrap.pack(fill=tk.BOTH, expand=True, padx=P, pady=6)

        # ── заголовок
        top = tk.Frame(wrap, bg=BG)
        top.pack(fill=tk.X, pady=(0, 4))
        tk.Label(top, text="КАТАН", font=fh, bg=BG, fg=WHITE).pack(side=tk.LEFT)
        right = tk.Frame(top, bg=BG)
        right.pack(side=tk.RIGHT)
        self.lbl_cnt = tk.Label(right, text="Бросков: 0", font=fe, bg=BG, fg=DIM)
        self.lbl_cnt.pack(anchor="e")
        self.lbl_timer = tk.Label(right, text="", font=f_timer, bg=BG, fg=BORDER)
        self.lbl_timer.pack(anchor="e")

        tk.Frame(wrap, bg=BORDER, height=1).pack(fill=tk.X, pady=(0, 6))

        # ── карточка события
        card = tk.Frame(wrap, bg=PANEL, highlightbackground=BORDER, highlightthickness=1)
        card.pack(fill=tk.X)
        tk.Label(card, text="СОБЫТИЕ", font=f_label, bg=PANEL, fg=DIM
                 ).pack(anchor="w", padx=14, pady=(8, 0))
        self.lbl_event = tk.Label(card, text="Нажмите кнопку",
                                  font=f_event, bg=PANEL, fg=GOLD)
        self.lbl_event.pack(pady=(6, 2))
        self.lbl_sub = tk.Label(card, text="чтобы начать",
                                font=f_sub, bg=PANEL, fg=DIM)
        self.lbl_sub.pack(pady=(0, 8))

        # ── кубики
        tk.Frame(wrap, bg=BG, height=6).pack()
        tk.Label(wrap, text="КУБИКИ", font=f_label, bg=BG, fg=DIM
                 ).pack(anchor="w", padx=2)
        dice_row = tk.Frame(wrap, bg=BG)
        dice_row.pack(fill=tk.X, pady=4)
        dice_row.columnconfigure(0, weight=1)
        dice_row.columnconfigure(1, weight=1)
        self.die1 = Die(dice_row, size=DICE_SIZE, highlight=False)
        self.die1.grid(row=0, column=0, padx=6)
        self.die2 = Die(dice_row, size=DICE_SIZE, highlight=True)
        self.die2.grid(row=0, column=1, padx=6)

        # ── сумма
        self.sum_cell = tk.Frame(wrap, bg=PANEL,
                                 highlightbackground=BORDER, highlightthickness=1)
        self.sum_cell.pack(fill=tk.X)
        tk.Label(self.sum_cell, text="СУММА", font=f_sum_s,
                 bg=PANEL, fg=DIM).pack(pady=(6, 0))
        self.lbl_sum = tk.Label(self.sum_cell, text="—",
                                font=f_sum, bg=PANEL, fg=GREEN)
        self.lbl_sum.pack(pady=(0, 6))

        # ── кнопки: БРОСИТЬ + СТАТ
        tk.Frame(wrap, bg=BG, height=10).pack()
        btn_row = tk.Frame(wrap, bg=BG)
        btn_row.pack(fill=tk.X)
        btn_row.columnconfigure(0, weight=4)
        btn_row.columnconfigure(1, weight=1)

        self.btn = tk.Button(
            btn_row, text="БРОСИТЬ КУБИКИ",
            font=f_btn, bg=BTN, fg="white",
            activebackground=BTN_HOV, activeforeground="white",
            relief=tk.FLAT, bd=0, pady=18,
            cursor="hand2", command=self._roll)
        self.btn.grid(row=0, column=0, sticky="nsew", padx=(0, 4))
        self.btn.bind("<Enter>", lambda e: self.btn.config(bg=BTN_HOV))
        self.btn.bind("<Leave>", lambda e: self.btn.config(bg=BTN))

        stat_btn = tk.Button(
            btn_row, text="СТАТ",
            font=f_btn_s, bg=BORDER, fg=WHITE,
            activebackground=DIM, activeforeground=WHITE,
            relief=tk.FLAT, bd=0, pady=18,
            cursor="hand2", command=self._show_stats)
        stat_btn.grid(row=0, column=1, sticky="nsew")

        # ── история
        tk.Frame(wrap, bg=BG, height=8).pack()
        tk.Label(wrap, text="ИСТОРИЯ", font=f_label, bg=BG, fg=DIM
                 ).pack(anchor="w", padx=2)
        hist_frame = tk.Frame(wrap, bg=PANEL,
                              highlightbackground=BORDER, highlightthickness=1)
        hist_frame.pack(fill=tk.X, pady=(4, 0))
        self.hist_labels = []
        for _ in range(4):
            lbl = tk.Label(hist_frame, text="", font=f_hist,
                           bg=PANEL, fg=DIM, anchor="w")
            lbl.pack(fill=tk.X, padx=12, pady=1)
            self.hist_labels.append(lbl)

    # ── логика ────────────────────────────────────────────────────────────────
    def _roll(self):
        name, sub, color = random.choice(EVENTS)
        d1 = random.randint(1, 6)
        d2 = random.randint(1, 6)
        total = d1 + d2

        elapsed = self._timer_stop()
        if elapsed is not None:
            self._total_think += elapsed

        self._sums.append(total)
        if name in self._ev_counts:
            self._ev_counts[name][0] += 1

        self.die1.roll(d1, color)
        self.die2.roll(d2, color)

        self.after(650, lambda: self._update(name, sub, color, d1, d2))

        self._count += 1
        self.lbl_cnt.config(text=f"Бросков: {self._count}")

        think = f" [{elapsed}с]" if elapsed is not None else ""
        entry = f"#{self._count}  {name}  {d1}+{d2}={total}{think}"
        self._history.insert(0, entry)
        self._history = self._history[:4]
        for i, lbl in enumerate(self.hist_labels):
            lbl.config(text=self._history[i] if i < len(self._history) else "")

        self.btn.config(state=tk.DISABLED)
        self.after(750, lambda: self.btn.config(state=tk.NORMAL))
        self.after(760, self._timer_start)

    def _timer_start(self):
        if self._timer_job:
            self.after_cancel(self._timer_job)
        self._timer_seconds = 0
        self._timer_running = True
        self.lbl_timer.config(text="0 сек")
        self._timer_tick()

    def _timer_stop(self):
        if self._timer_job:
            self.after_cancel(self._timer_job)
            self._timer_job = None
        if not self._timer_running:
            return None
        self._timer_running = False
        elapsed = self._timer_seconds
        self.lbl_timer.config(text="")
        return elapsed

    def _timer_tick(self):
        if not self._timer_running:
            return
        self._timer_seconds += 1
        self.lbl_timer.config(text=f"{self._timer_seconds} сек")
        self._timer_job = self.after(1000, self._timer_tick)

    def _update(self, name, sub, color, d1, d2):
        is_barbarians = (name == "Варвары!")
        event_text = name if is_barbarians else f"{name} ({d2})"
        self.lbl_event.config(text=event_text, fg=color)
        self.lbl_sub.config(text=f"({sub})" if sub else " ", fg=color)
        self.lbl_sum.config(text=str(d1 + d2), fg=color)

    def _show_stats(self):
        # Добавляем текущее время таймера к итогу
        current = self._timer_seconds if self._timer_running else 0
        StatsWindow(self, list(self._sums), self._total_think + current, dict(self._ev_counts))


if __name__ == "__main__":
    App().mainloop()
