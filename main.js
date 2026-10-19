/* main.js - starts the app, bottom tab navigation, theme and button clicks */

const NAV = [
  { id: "salah", label: "Salah", icon: "moon" },
  { id: "tasks", label: "Tasks", icon: "checkSquare" },
  { id: "notes", label: "Notes", icon: "fileText" },
  { id: "projects", label: "Projects", icon: "users" },
  { id: "settings", label: "More", icon: "sliders" }
];

const Theme = {
  apply() {
    const theme = Store.data.settings.theme;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#04241c" : "#f6f0df");
  }
};

// Bottom tab bar
const Tabs = {
  build() {
    $("#tabbar").innerHTML = NAV.map((item) =>
      '<a class="tab" href="#/' + item.id + '" data-nav="' + item.id + '"><span class="tab-icon">' + icon(item.icon, 22) + "</span><span>" + item.label + "</span></a>"
    ).join("");
  },
  highlight() {
    document.querySelectorAll(".tab").forEach(function (tab) {
      const on = tab.dataset.nav === App.current;
      tab.classList.toggle("active", on);
      if (on) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current");
    });
  }
};

// What each button (data-action) does
const Actions = {
  "salah-tab": (id, b) => Salah.setTab(b.dataset.value),
  "salah-day": (id, b) => Salah.moveDay(Number(b.dataset.value)),
  "salah-toggle": (id, b) => Salah.toggle(b.dataset.item),
  "salah-month": (id, b) => Salah.moveMonth(Number(b.dataset.value)),
  "salah-goto": (id, b) => Salah.goTo(b.dataset.date),
  "salah-allow": async () => { await Reminders.turnOn(); Salah.render(); },

  "add-task": () => Tasks.openEditor(),
  "toggle-task": (id) => Tasks.toggle(id),
  "edit-task": (id) => Tasks.openEditor(id),
  "delete-task": (id) => Tasks.remove(id),
  "pick-day": (id, b) => Tasks.pickDay(b.dataset.value),
  "quick-add": () => Tasks.quickAdd(),
  "enable-reminders": async () => { await Reminders.turnOn(); Tasks.render(); },

  "new-note": () => Notes.addNew(),
  "open-note": (id) => Notes.openNote(id),
  "close-note": () => Notes.closeNote(),
  "pin-note": () => Notes.togglePin(),
  "delete-note": () => Notes.remove(),
  "download-txt": () => Notes.downloadText(),

  "add-project": () => Projects.openEditor(),
  "edit-project": () => Projects.openEditor(Projects.cur),
  "delete-project": () => Projects.remove(Projects.cur),
  "open-project": (id) => { Projects.cur = id; Projects.render(); window.scrollTo(0, 0); },
  "back-projects": () => { Projects.cur = null; Projects.render(); },
  "add-task-to": (id, b) => Projects.openCard(null, "todo", b.dataset.value),
  "add-member": () => Projects.openEditor(Projects.cur),
  "edit-card": (id) => Projects.openCard(id),
  "cycle-task": (id) => Projects.cycle(id),

  "open-set": (id, b) => Settings.panel(b.dataset.value),
  "toggle-reminders": () => Settings.toggleReminders(),
  "test-reminder": () => Reminders.test(),
  "set-timeFormat": (id, b) => Settings.setTimeFormat(b.dataset.value),
  "set-theme": (id, b) => Settings.setTheme(b.dataset.value),
  "install-app": () => Settings.install(),
  "share-app": () => Settings.share(),
  "export-data": () => Settings.exportData(),
  "import-data": () => $("#import-file").click(),
  "reset-data": () => Settings.reset()
};

const App = {
  current: "salah",

  init() {
    Store.load();
    Theme.apply();
    Sheet.init();
    Notes.init();
    Tabs.build();

    $("#backdrop").addEventListener("click", () => Sheet.close());
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") Sheet.close(); });

    // One click listener for every button with data-action
    document.addEventListener("click", (event) => {
      const nav = event.target.closest("[data-nav]");
      if (nav) { event.preventDefault(); App.go(nav.dataset.nav); return; }
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const action = Actions[button.dataset.action];
      if (!action) return;
      const holder = button.closest("[data-id]");
      action(holder ? holder.dataset.id : null, button, event);
    });

    window.addEventListener("hashchange", () => this.route());

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      Settings.installPrompt = event;
      if (App.current === "settings") Settings.render();
    });

    document.addEventListener("visibilitychange", () => { if (document.hidden) Notes.flush(); });

    
    Reminders.start();
    this.route();
  },

  // Switch screen without loading a new page address (works inside preview frames)
  go(name) {
    this.current = NAV.some((item) => item.id === name) ? name : "salah";
    try { history.replaceState(null, "", "#/" + this.current); } catch (e) {}
    this.render();
    window.scrollTo(0, 0);
  },

  route() {
    const name = location.hash.replace("#/", "");
    this.current = NAV.some((item) => item.id === name) ? name : "salah";
    this.render();
    window.scrollTo(0, 0);
  },

  render() {
    Notes.flush();   // never lose a pending note edit when changing screens
    if (this.current === "salah") Salah.render();
    if (this.current === "tasks") Tasks.render();
    if (this.current === "notes") Notes.render();
    if (this.current === "projects") Projects.render();
    if (this.current === "settings") Settings.render();
    Tabs.highlight();
  },

  registerServiceWorker() {
    const secure = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if ("serviceWorker" in navigator && secure) {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    }
  }
};

App.registerServiceWorker();
App.init();
