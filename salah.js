/* salah.js - Salah & Quran tracker: daily score, history, statistics and reminders
   Data lives in Store.data.salah:
     log["YYYY-MM-DD"] = { fajr, dhuhr, asr, maghrib, isha, quran }   (one record per date)
     reminders[id]     = { on, time: "HH:MM", last: "YYYY-MM-DD" }
   The score is always calculated, never stored:  prayers x 10 + Quran x 20  (max 70). */

const Salah = {
  tab: "today",     // today | history | reminders
  date: null,       // the day being viewed or corrected
  month: null,      // "YYYY-MM" shown in the calendar
  PRAYERS: [["fajr", "Fajr"], ["dhuhr", "Dhuhr"], ["asr", "Asr"], ["maghrib", "Maghrib"], ["isha", "Isha"]],
  MAX: 70,

  // ---------- Dates ----------
  key(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); },
  parse(k) { const p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); },
  today() { return this.key(new Date()); },
  shift(k, days) { const d = this.parse(k); d.setDate(d.getDate() + days); return this.key(d); },
  lastDays(n) { const out = []; for (let i = n - 1; i >= 0; i--) out.push(this.shift(this.today(), -i)); return out; },
  monthKeys(ym) {                               // every day of a month up to today
    const y = +ym.slice(0, 4), m = +ym.slice(5, 7), out = [];
    for (let day = 1; day <= new Date(y, m, 0).getDate(); day++) {
      const k = ym + "-" + pad(day);
      if (k <= this.today()) out.push(k);
    }
    return out;
  },

  // ---------- Scoring ----------
  score(k) {
    const r = Store.data.salah.log[k] || {};
    let prayers = 0;
    this.PRAYERS.forEach((p) => { if (r[p[0]]) prayers++; });
    const quran = !!r.quran;
    return { prayers: prayers, quran: quran, points: prayers * 10 + (quran ? 20 : 0) };
  },
  percent(keys) {
    if (!keys.length) return 0;
    let total = 0;
    keys.forEach((k) => { total += this.score(k).points; });
    return Math.round(total / (keys.length * this.MAX) * 100);
  },
  streak() {                                    // days in a row with all five prayers
    let k = this.today(), n = 0;
    if (this.score(k).prayers < 5) k = this.shift(k, -1);
    while (this.score(k).prayers === 5) { n++; k = this.shift(k, -1); }
    return n;
  },

  // ---------- Changing data ----------
  toggle(item) {
    const log = Store.data.salah.log;
    const k = this.date;
    const rec = log[k] || (log[k] = {});          // same date = same record, so no duplicates
    rec[item] = !rec[item];
    if (!this.PRAYERS.some((p) => rec[p[0]]) && !rec.quran) delete log[k];
    Store.save();
    this.render();
  },
  setTab(t) { this.tab = t; this.render(); },
  moveDay(n) {
    const next = this.shift(this.date, n);
    if (next <= this.today()) { this.date = next; this.month = next.slice(0, 7); this.render(); }
  },
  moveMonth(n) {
    const y = +this.month.slice(0, 4), m = +this.month.slice(5, 7) - 1 + n;
    const d = new Date(y, m, 1);
    const ym = d.getFullYear() + "-" + pad(d.getMonth() + 1);
    if (ym <= this.today().slice(0, 7)) { this.month = ym; this.render(); }
  },
  goTo(k) { if (k <= this.today()) { this.date = k; this.tab = "today"; this.render(); window.scrollTo(0, 0); } },

  // ---------- Screens ----------
  render() {
    if (!this.date) this.date = this.today();
    if (!this.month) this.month = this.date.slice(0, 7);
    const tabs = [["today", "Today"], ["history", "History"], ["reminders", "Reminders"]];
    const chips = tabs.map((t) =>
      '<button class="utab' + (t[0] === this.tab ? " active" : "") + '" data-action="salah-tab" data-value="' + t[0] + '">' + t[1] + "</button>"
    ).join("");
    const body = this.tab === "history" ? this.historyHtml() : this.tab === "reminders" ? this.remindersHtml() : this.todayHtml();
    $("#view").innerHTML =
      '<div class="page-top"><div><p class="eyebrow">' + esc(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })) + '</p><h1>Assalamu Alaikum</h1></div></div>' +
      '<div class="utabs">' + chips + "</div>" + body;
    if (this.tab === "reminders") this.bindReminders();
  },

  // The day arc: five prayers placed along the sun's path, from before dawn to after dusk
  ARC: { cx: 160, cy: 140, rx: 130, ry: 114 },
  ANGLES: { fajr: 190, dhuhr: 105, asr: 58, maghrib: 22, isha: -30 },
  AR: { fajr: "فجر", dhuhr: "ظهر", asr: "عصر", maghrib: "مغرب", isha: "عشاء" },
  GLYPH: {
    fajr: '<path d="M4 17h16M7 17a5 5 0 0 1 10 0M12 6v3M5.5 10.5l1.8 1.8M18.5 10.5l-1.8 1.8"/>',
    dhuhr: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    asr: '<circle cx="10" cy="10" r="3.5"/><path d="M10 3v1.8M3 10h1.8M5 5l1.3 1.3M15 5l-1.3 1.3M4 19.5h16M7 16.5h13"/>',
    maghrib: '<path d="M4 14h16M7 14a5 5 0 0 1 10 0M12 18v3M9.5 19.5L12 21l2.5-1.5"/>',
    isha: '<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z"/><path d="M17.5 4v3M16 5.5h3"/>'
  },
  pt(id) {
    const a = this.ANGLES[id] * Math.PI / 180, A = this.ARC;
    return { x: A.cx + A.rx * Math.cos(a), y: A.cy - A.ry * Math.sin(a) };
  },

  arcHtml(rec, s, isToday) {
    const A = this.ARC, ids = this.PRAYERS.map((p) => p[0]);
    const f = (n) => n.toFixed(1);
    const first = this.pt(ids[0]), last = this.pt(ids[4]);
    const arc = (a, b) => "M" + f(a.x) + " " + f(a.y) + " A" + A.rx + " " + A.ry + " 0 0 1 " + f(b.x) + " " + f(b.y);
    let lit = "";
    for (let i = 0; i < 4; i++) {
      if (rec[ids[i]] && rec[ids[i + 1]]) lit += '<path class="sky-lit" d="' + arc(this.pt(ids[i]), this.pt(ids[i + 1])) + '"/>';
    }
    const nextId = isToday ? ids.find((id) => !rec[id]) : null;
    const svg = '<svg viewBox="0 0 320 250" aria-hidden="true">' +
      '<path class="sky-dome" d="M' + (A.cx - A.rx) + " " + A.cy + " A" + A.rx + " " + A.ry + " 0 0 1 " + (A.cx + A.rx) + " " + A.cy + ' Z"/>' +
      '<rect class="sky-night" x="' + (A.cx - A.rx - 6) + '" y="' + A.cy + '" width="' + (A.rx * 2 + 12) + '" height="104" rx="14"/>' +
      '<line class="sky-horizon" x1="' + (A.cx - A.rx - 6) + '" y1="' + A.cy + '" x2="' + (A.cx + A.rx + 6) + '" y2="' + A.cy + '"/>' +
      '<path class="sky-path" d="' + arc(first, last) + '"/>' + lit + "</svg>";
    const stops = this.PRAYERS.map((p) => {
      const q = this.pt(p[0]), on = !!rec[p[0]];
      return '<button class="stop' + (on ? " on" : "") + (p[0] === nextId ? " next" : "") + '" style="left:' + (q.x / 3.2).toFixed(2) + "%;top:" + (q.y / 2.5).toFixed(2) + '%" data-action="salah-toggle" data-item="' + p[0] + '" aria-pressed="' + on + '" aria-label="' + p[1] + '">' +
        '<span class="stop-orb"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + this.GLYPH[p[0]] + "</svg></span>" +
        '<span class="stop-name">' + p[1] + '</span><span class="stop-ar" lang="ar" dir="rtl">' + this.AR[p[0]] + "</span></button>";
    }).join("");
    return '<section class="skyarc">' + svg +
      '<div class="sky-center"><b>' + s.prayers + "<i>/5</i></b><small>prayers today</small></div>" + stops + "</section>";
  },

  todayHtml() {
    const k = this.date, s = this.score(k), rec = Store.data.salah.log[k] || {};
    const isToday = k === this.today();
    const full = this.parse(k).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const msg = s.points === this.MAX ? "Full score. May Allah accept it." : s.points === 0 ? "A fresh page. Begin with the next prayer." : "Keep going, one step at a time.";
    return '<div class="day-nav">' +
      '<button class="round" data-action="salah-day" data-value="-1" aria-label="Previous day">&lsaquo;</button>' +
      "<div><strong>" + dayLabel(this.parse(k)) + "</strong><span>" + esc(full) + "</span></div>" +
      '<button class="round" data-action="salah-day" data-value="1" aria-label="Next day"' + (isToday ? " disabled" : "") + ">&rsaquo;</button></div>" +
      this.arcHtml(rec, s, isToday) +
      '<p class="sky-msg">' + msg + "</p>" +
      '<p class="sky-meta">' + s.points + " of 70 points &middot; Quran " + (s.quran ? "done" : "not yet") + "</p>" +
      '<h2 class="sect">Quran</h2>' +
      '<button class="quran-bar' + (rec.quran ? " on" : "") + '" data-action="salah-toggle" data-item="quran" aria-pressed="' + !!rec.quran + '">' + icon("book", 24) +
      "<span><b>Daily reading</b><small>Goal worth 20 points</small></span><span class=\"quran-check\">" + icon("check", 18) + "</span></button>" +
      '<p class="muted hint">Tap to mark or unmark. ' + (isToday ? "Use the arrows to correct an earlier day." : "You are editing a past day; changes save automatically.") + "</p>";
  },

  historyHtml() {
    const week = this.lastDays(7);
    const bars = week.map((k) => {
      const p = this.score(k).points;
      const day = this.parse(k).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
      return '<div class="bar' + (p === 0 ? " zero" : "") + '" title="' + k + ": " + p + ' points"><span>' + p + '</span><i style="height:' + Math.max(3, Math.round(p / this.MAX * 80)) + 'px"></i><span>' + esc(day) + "</span></div>";
    }).join("");

    const y = +this.month.slice(0, 4), m = +this.month.slice(5, 7);
    const first = new Date(y, m - 1, 1), offset = (first.getDay() + 6) % 7;   // week starts Monday
    const title = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    let cells = ["M", "T", "W", "T", "F", "S", "S"].map((d) => '<span class="cal-dow">' + d + "</span>").join("");
    for (let i = 0; i < offset; i++) cells += '<span class="cal-blank"></span>';
    for (let day = 1; day <= new Date(y, m, 0).getDate(); day++) {
      const k = this.month + "-" + pad(day), p = this.score(k).points;
      const lv = p === 0 ? 0 : p < 35 ? 1 : p < 55 ? 2 : p < 70 ? 3 : 4;
      cells += '<button class="cal-day lv' + lv + (k === this.today() ? " today" : "") + '" data-action="salah-goto" data-date="' + k + '" aria-label="' + k + ", " + p + ' points"' + (k > this.today() ? " disabled" : "") + ">" + day + "</button>";
    }
    const atNow = this.month >= this.today().slice(0, 7);

    const recent = this.lastDays(7).reverse().map((k) => {
      const s = this.score(k);
      return '<li><button data-action="salah-goto" data-date="' + k + '"><span>' + dayLabel(this.parse(k)) + "</span><small>" + s.prayers + "/5 prayers &middot; Quran " + (s.quran ? "yes" : "no") + " &middot; " + s.points + " pts</small></button></li>";
    }).join("");

    return '<div class="stats">' +
      '<div class="card stat"><b>' + this.percent(week) + "%</b><span>This week</span></div>" +
      '<div class="card stat"><b>' + this.percent(this.monthKeys(this.today().slice(0, 7))) + "%</b><span>This month</span></div>" +
      '<div class="card stat"><b>' + this.streak() + "</b><span>Day streak</span></div></div>" +
      '<div class="card panel"><h3>Last 7 days</h3><div class="bars">' + bars + "</div></div>" +
      '<div class="card panel"><div class="cal-head"><button class="icon-btn small" data-action="salah-month" data-value="-1" aria-label="Previous month">&lsaquo;</button><strong>' + esc(title) + "</strong>" +
      '<button class="icon-btn small" data-action="salah-month" data-value="1" aria-label="Next month"' + (atNow ? " disabled" : "") + ">&rsaquo;</button></div>" +
      '<div class="cal">' + cells + "</div>" +
      '<div class="legend">Less <i style="background:var(--chip)"></i><i style="background:rgba(201,162,74,.25)"></i><i style="background:rgba(201,162,74,.5)"></i><i style="background:rgba(201,162,74,.8)"></i><i style="background:var(--accent-1)"></i> Full</div>' +
      '<p class="muted hint">Streak = days in a row with all five prayers. Tap a date to view or correct it.</p></div>' +
      '<div class="card panel"><h3>Recent days</h3><ul class="hist">' + recent + "</ul></div>";
  },

  // ---------- Reminders ----------
  NAMES: { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha", quran: "Quran reading" },

  remindersHtml() {
    const cfg = Store.data.salah.reminders;
    let status, allow = "";
    if (!Reminders.supported()) {
      status = '<span class="status-off">This browser cannot show notifications.</span> Reminders will appear as a message inside the app while it is open.';
    } else if (Notification.permission === "denied") {
      status = '<span class="status-off">Notifications are blocked.</span> Allow them in your browser or site settings, or reminders will only show inside the app while it is open.';
    } else if (Reminders.enabled()) {
      status = '<span class="status-ok">Notifications are allowed.</span>';
    } else {
      status = '<span class="status-off">Notifications are not allowed yet.</span> Your browser asks for permission the first time you switch a reminder on.';
      allow = '<button class="btn primary block" data-action="salah-allow">' + icon("bell", 20) + " Allow notifications</button>";
    }
    const rows = Object.keys(this.NAMES).map((id) =>
      '<div class="rem-row"><b>' + this.NAMES[id] + '</b>' +
      '<input class="field" type="time" data-rem="' + id + '" value="' + cfg[id].time + '" aria-label="' + this.NAMES[id] + ' reminder time">' +
      '<label class="switch"><input type="checkbox" data-rem-on="' + id + '"' + (cfg[id].on ? " checked" : "") + ' aria-label="' + this.NAMES[id] + ' reminder on or off"><span></span></label></div>'
    ).join("");
    return '<div class="card panel"><h3>Reminders</h3><p class="muted">' + status + "</p>" + allow + "</div>" +
      '<div class="card panel">' + rows + "</div>" +
      '<p class="muted hint">The default times are only placeholders: set each one to your local prayer time. A web app can notify you while it is open or in the background, but phones may stop it when it is fully closed. For a guaranteed call to prayer, also keep your phone\'s own alarm or prayer app. The master switch is also in Settings.</p>';
  },

  bindReminders() {
    const cfg = Store.data.salah.reminders;
    document.querySelectorAll("input[data-rem]").forEach((input) => {
      input.addEventListener("change", () => {
        if (!/^\d\d:\d\d$/.test(input.value)) { input.value = cfg[input.dataset.rem].time; return; }
        cfg[input.dataset.rem].time = input.value;
        cfg[input.dataset.rem].last = "";          // new time = can fire again today
        Store.save();
        toast("Reminder time saved.", "ok");
      });
    });
    document.querySelectorAll("input[data-rem-on]").forEach((input) => {
      input.addEventListener("change", async () => {
        const id = input.dataset.remOn;
        if (input.checked && Reminders.supported() && Notification.permission === "default") await Reminders.turnOn();
        cfg[id].on = input.checked;
        Store.save();
        this.render();
      });
    });
  },

  // Called every 15 seconds by Reminders.check(): fires reminders whose time has passed today
  checkReminders() {
    const cfg = Store.data.salah && Store.data.salah.reminders;
    if (!cfg) return;
    const now = new Date(), key = this.today(), mins = now.getHours() * 60 + now.getMinutes();
    let changed = false;
    Object.keys(cfg).forEach((id) => {
      const c = cfg[id];
      if (!c.on || c.last === key) return;
      const at = +c.time.slice(0, 2) * 60 + +c.time.slice(3, 5);
      if (mins < at) return;
      c.last = key;
      changed = true;
      if (mins - at > 120) return;                                  // missed by over 2 hours: stay quiet
      if ((Store.data.salah.log[key] || {})[id]) return;            // already done today
      const text = id === "quran" ? "Time for your daily Quran reading." : "It is time for " + this.NAMES[id] + ".";
      Reminders.notify("Focus List", text);                          // does nothing if notifications are not allowed
      if (!document.hidden) toast(text);                            // in-app fallback while the app is open
    });
    if (changed) Store.save();
  }
};
