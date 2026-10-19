/* store.js - keeps all app data in the browser (localStorage) */

const Store = {
  KEY: "focuslist-data-v1",
  data: null,

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  defaults() {
    return {
      tasks: [],
      notes: [],
      projects: [],
      activeNoteId: null,
      seeded: false,
      settings: { theme: "dark", timeFormat: "12", reminders: false }
    };
  },

  load() {
    const defaults = this.defaults();
    let saved = null;

    try {
      saved = JSON.parse(localStorage.getItem(this.KEY));
    } catch (error) {
      saved = null;   // broken or missing data: start fresh
    }

    this.data = Object.assign(this.defaults(), saved || {});
    this.data.settings = Object.assign(defaults.settings, (saved && saved.settings) || {});

    ["tasks", "notes", "projects"].forEach((name) => {
      if (!Array.isArray(this.data[name])) this.data[name] = [];
    });

    this.ensureSalah();
    if (!this.data.seeded) this.seed();

    // One-time clean-up: remove the old example tasks, note and project
    if (!this.data.demoCleared) {
      const D = this.data;
      const demoTasks = ["Go for a walk", "Finish the OOP assignment", "Buy a notebook"];
      D.tasks = D.tasks.filter((t) => demoTasks.indexOf(t.title) < 0);
      D.notes = D.notes.filter((n) => !(n.title === "Welcome" && /Hello!/.test(n.html || "")));
      D.projects = D.projects.filter((p) => !(p.name === "Final Year Project" && (p.members || []).map((m) => m.name).join() === "Ayesha,Ali,Sara"));
      D.demoCleared = true;
      this.save();
    }
  },

  // Salah data is added to old saves safely: nothing existing is touched
  ensureSalah() {
    const times = { fajr: "05:00", dhuhr: "13:00", asr: "16:30", maghrib: "18:30", isha: "20:30", quran: "21:30" };
    let s = this.data.salah;
    if (!s || typeof s !== "object" || Array.isArray(s)) s = this.data.salah = {};
    if (!s.log || typeof s.log !== "object" || Array.isArray(s.log)) s.log = {};      // log["2026-10-19"] = { fajr: true, ... }
    if (!s.reminders || typeof s.reminders !== "object") s.reminders = {};
    Object.keys(times).forEach((id) => {
      const r = s.reminders[id] || {};
      s.reminders[id] = { on: r.on === true, time: /^\d\d:\d\d$/.test(r.time) ? r.time : times[id], last: r.last || "" };
    });
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
      return true;
    } catch (error) {
      toast("Could not save. Your browser storage may be full.", "error");
      return false;
    }
  },

  // Nothing is pre-filled: a new install starts completely empty
  seed() {
    this.data.seeded = true;
    this.save();
  }
};
