/* tasks.js - the "All Tasks" screen */

const Tasks = {
  filter: "all",   // all | today | upcoming | done

  find(id) {
    return Store.data.tasks.find((task) => task.id === id);
  },

  sel: "",   // a day like "2026-10-19", or "inbox" for tasks with no date

  key(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  },

  render() {
    const T = Store.data.tasks, now = Date.now(), tk = this.key(new Date());
    if (!this.sel) this.sel = tk;
    const startToday = startOfDay(new Date()).getTime();
    const day = (t) => (t.due ? t.due.slice(0, 10) : "");
    const pend = T.filter((t) => !t.done);
    const cmp = (a, b) => (a.done - b.done) || ((a.due || "") > (b.due || "") ? 1 : (a.due || "") < (b.due || "") ? -1 : 0);

    let days = '<button class="wd inbox' + (this.sel === "inbox" ? " on" : "") + '" data-action="pick-day" data-value="inbox"><small>Inbox</small><b>' + pend.filter((t) => !t.due).length + "</b><i></i></button>";
    for (let n = 0; n < 14; n++) {
      const dt = new Date(); dt.setDate(dt.getDate() + n);
      const k = this.key(dt), cnt = pend.filter((t) => day(t) === k).length;
      days += '<button class="wd' + (k === this.sel ? " on" : "") + '" data-action="pick-day" data-value="' + k + '"><small>' +
        (n === 0 ? "Today" : dt.toLocaleDateString(undefined, { weekday: "short" })) + "</small><b>" + dt.getDate() + '</b><i class="' + (cnt ? "has" : "") + '"></i></button>';
    }

    let title, shown;
    if (this.sel === "inbox") { title = "Inbox"; shown = T.filter((t) => !t.due); }
    else {
      const p = this.sel.split("-").map(Number);
      title = new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
      shown = T.filter((t) => day(t) === this.sel);
    }

    const row = (t, full) => {
      const late = !t.done && t.due && new Date(t.due).getTime() < now;
      const when = t.due ? (full ? formatDue(t.due) : formatTime(new Date(t.due))) : "";
      return '<li class="tk' + (t.done ? " done" : "") + (late ? " late" : "") + '" data-id="' + t.id + '">' +
        '<button class="radio-dot' + (t.done ? " on" : "") + '" data-action="toggle-task" aria-label="Mark done or pending">' + icon("check", 16) + "</button>" +
        '<div class="tk-m" data-action="edit-task"><div class="tk-t">' + esc(t.title) + "</div>" +
        (when ? '<div class="tk-s">' + icon("clock", 12) + " " + esc(when) + "</div>" : "") + "</div></li>";
    };

    const overdue = this.sel === tk ? pend.filter((t) => t.due && new Date(t.due).getTime() < startToday).sort(cmp) : [];
    const left = shown.filter((t) => !t.done).length, pct = shown.length ? Math.round((shown.length - left) / shown.length * 100) : 0;

    let body = overdue.length ? '<h3 class="grp late">Overdue</h3><ul class="tlist">' + overdue.map((t) => row(t, true)).join("") + "</ul>" : "";
    body += shown.length
      ? '<ul class="tlist">' + shown.sort(cmp).map((t) => row(t, false)).join("") + "</ul>"
      : '<div class="blank"><span class="blank-arch">' + icon("checkSquare", 28) + "</span><h3>Nothing planned</h3><p class=\"muted\">Type below to add your first task.</p></div>";

    let remind = "";
    if (!Store.data.settings.reminders && pend.some((t) => t.due) && Reminders.supported()) {
      remind = '<div class="note-strip">' + icon("bell", 20) + "<span>Get a notification when a task is due.</span>" +
        '<button class="link-btn" data-action="enable-reminders">Turn on</button></div>';
    }

    $("#view").innerHTML =
      '<h1 class="hero-date">' + esc(title) + "</h1>" +
      '<p class="sub">' + left + " left, " + (shown.length - left) + " done</p>" +
      '<div class="pbar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="wk">' + days + "</div>" + remind + body + '<div style="height:84px"></div>' +
      '<div class="qbar"><input id="qa" class="field" maxlength="120" autocomplete="off" placeholder="' + (this.sel === "inbox" ? "Add to inbox" : "Add a task for this day") + '">' +
      '<button class="add-btn" data-action="quick-add" aria-label="Add task">' + icon("plus", 20) + "</button>" +
      '<button class="round" data-action="add-task" aria-label="Add with time">' + icon("clock", 18) + "</button></div>";

    $("#qa").addEventListener("keydown", (e) => { if (e.key === "Enter") this.quickAdd(); });
    const on = $(".wd.on");
    if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
  },

  pickDay(v) { this.sel = v; this.render(); },

  quickAdd() {
    const input = $("#qa"), title = input.value.trim();
    if (!title) { input.focus(); return; }
    let due = "";
    if (this.sel !== "inbox") {
      const p = this.sel.split("-").map(Number), dt = new Date(p[0], p[1] - 1, p[2], 9, 0, 0, 0), n = new Date();
      if (this.key(n) === this.sel) { const h = n.getHours() + 1; dt.setHours(Math.min(h, 23), h > 23 ? 59 : 0, 0, 0); }
      due = toInputValue(dt);
    }
    Store.data.tasks.push({ id: Store.uid(), title: title, due: due, done: false, notified: false, createdAt: Date.now() });
    Store.save();
    this.render();
    Reminders.check();
    $("#qa").focus();
  },

  toggle(id) {
    const task = this.find(id);
    if (!task) return;
    task.done = !task.done;
    Store.save();
    this.render();
  },

  remove(id) {
    const task = this.find(id);
    if (!task) return;
    confirmSheet('"' + task.title + '" will be deleted.', "Delete", () => {
      Store.data.tasks = Store.data.tasks.filter((t) => t.id !== id);
      Store.save();
      this.render();
      toast("Task deleted.");
    });
  },

  // Opens the "New task" / "Edit task" sheet
  openEditor(id) {
    const task = id ? this.find(id) : null;
    const pad2 = (n) => String(n).padStart(2, "0");
    const self = this;
    let date = "", hh = 9, mm = 0;
    if (task && task.due) { date = task.due.slice(0, 10); hh = Number(task.due.slice(11, 13)) || 0; mm = Number(task.due.slice(14, 16)) || 0; }
    else if (!task) {
      if (this.sel && this.sel !== "inbox") date = this.sel;
      const n = new Date();
      if (date === this.key(n)) hh = Math.min(n.getHours() + 1, 23);
    }
    const is24 = Store.data.settings.timeFormat === "24";
    const fmt = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return formatTime(d); };

    const days = [];
    for (let n = 0; n < 21; n++) { const d = new Date(); d.setDate(d.getDate() + n); days.push(d); }
    const keys = days.map((d) => self.key(d));
    if (date && keys.indexOf(date) < 0) { const q = date.split("-").map(Number); days.unshift(new Date(q[0], q[1] - 1, q[2])); keys.unshift(date); }

    const presets = [["Morning", 9, 0], ["Noon", 12, 0], ["Afternoon", 15, 0], ["Evening", 19, 0], ["Night", 21, 0]];

    Sheet.open(
      '<h2 class="sheet-title">' + (task ? "Edit task" : "New task") + "</h2>" +
      '<input id="t-title" class="big-in" maxlength="120" placeholder="What needs doing?" autocomplete="off" aria-label="Task">' +
      '<label class="label">Day</label>' +
      '<div class="dstrip" id="t-days"><button type="button" class="dd none" data-k="">No date</button>' +
      days.map((d, i) => '<button type="button" class="dd" data-k="' + keys[i] + '"><small>' + (keys[i] === self.key(new Date()) ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" })) + "</small><b>" + d.getDate() + "</b></button>").join("") + "</div>" +
      '<label class="label">Time</label>' +
      '<div class="tpick" id="t-time">' +
      '<div class="tcol"><button type="button" data-t="h+" aria-label="Hour up">+</button><b id="t-h"></b><button type="button" data-t="h-" aria-label="Hour down">−</button></div>' +
      '<span class="tcolon">:</span>' +
      '<div class="tcol"><button type="button" data-t="m+" aria-label="Minutes up">+</button><b id="t-m"></b><button type="button" data-t="m-" aria-label="Minutes down">−</button></div>' +
      (is24 ? "" : '<div class="ampm" id="t-ap"><button type="button" data-ap="am">AM</button><button type="button" data-ap="pm">PM</button></div>') + "</div>" +
      '<div class="pick presets" id="t-pre">' + presets.map((x) => '<button type="button" class="chip" data-h="' + x[1] + '" data-m="' + x[2] + '">' + x[0] + " " + fmt(x[1], x[2]) + "</button>").join("") + "</div>" +
      '<p class="when-sum" id="t-sum"></p>' +
      '<button class="btn primary block" id="t-save">' + (task ? "Save changes" : "Add task") + "</button>" +
      '<div class="sheet-foot"><button class="link-btn" data-sheet="close">Cancel</button>' + (task ? '<button class="link-btn danger-link2" id="t-del">Delete task</button>' : "") + "</div>",
      function (sheet) {
        const titleIn = $("#t-title", sheet);
        titleIn.value = task ? task.title : "";

        function draw() {
          $("#t-h", sheet).textContent = is24 ? pad2(hh) : String(hh % 12 || 12);
          $("#t-m", sheet).textContent = pad2(mm);
          sheet.querySelectorAll("#t-ap button").forEach((b) => b.classList.toggle("on", (b.dataset.ap === "pm") === (hh >= 12)));
          sheet.querySelectorAll("#t-days .dd").forEach((b) => b.classList.toggle("on", b.dataset.k === date));
          sheet.querySelectorAll("#t-pre .chip").forEach((b) => b.classList.toggle("on", Number(b.dataset.h) === hh && Number(b.dataset.m) === mm));
          $("#t-time", sheet).classList.toggle("off", !date);
          $("#t-pre", sheet).classList.toggle("off", !date);
          let sum = "No date. It will wait in your inbox.";
          if (date) { const q = date.split("-").map(Number); sum = dayLabel(new Date(q[0], q[1] - 1, q[2])) + " at " + fmt(hh, mm); }
          $("#t-sum", sheet).textContent = sum;
        }

        sheet.querySelector("#t-days").addEventListener("click", function (e) {
          const b = e.target.closest(".dd");
          if (b) { date = b.dataset.k; draw(); }
        });
        sheet.querySelector("#t-time").addEventListener("click", function (e) {
          const b = e.target.closest("button");
          if (!b) return;
          const t = b.dataset.t;
          if (t === "h+") hh = (hh + 1) % 24;
          if (t === "h-") hh = (hh + 23) % 24;
          if (t === "m+") mm = (mm + 5) % 60;
          if (t === "m-") mm = (mm + 55) % 60;
          if (b.dataset.ap) hh = (hh % 12) + (b.dataset.ap === "pm" ? 12 : 0);
          draw();
        });
        sheet.querySelector("#t-pre").addEventListener("click", function (e) {
          const b = e.target.closest(".chip");
          if (b) { hh = Number(b.dataset.h); mm = Number(b.dataset.m); draw(); }
        });
        draw();
        const act = sheet.querySelector("#t-days .dd.on");
        if (act) act.scrollIntoView({ inline: "center", block: "nearest" });

        function save() {
          const title = titleIn.value.trim();
          if (!title) { toast("Please type a task name.", "error"); titleIn.focus(); return; }
          Tasks.save(task, title, date ? date + "T" + pad2(hh) + ":" + pad2(mm) : "");
        }
        $("#t-save", sheet).addEventListener("click", save);
        titleIn.addEventListener("keydown", function (e) { if (e.key === "Enter") save(); });
        const del = $("#t-del", sheet);
        if (del) del.addEventListener("click", function () { Sheet.close(); Tasks.remove(task.id); });
        if (!task) setTimeout(function () { titleIn.focus(); }, 300);
      }
    );
  },

  save(task, title, due) {
    if (task) {
      if (task.due !== due) task.notified = false;   // new time = remind again
      task.title = title;
      task.due = due;
    } else {
      Store.data.tasks.push({
        id: Store.uid(), title: title, due: due,
        done: false, notified: false, createdAt: Date.now()
      });
    }

    Store.save();
    Sheet.close();
    this.render();
    toast(task ? "Task updated." : "Task added.", "ok");
    Reminders.check();
  }
};
