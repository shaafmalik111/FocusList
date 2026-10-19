/* settings.js - reminders, time format, theme, install, share and backup */

const Settings = {
  installPrompt: null,   // filled when the browser says the app can be installed

  isInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  },

  render() {
    const st = Store.data.settings, on = Reminders.enabled();
    const left = Store.data.tasks.filter((t) => !t.done).length;
    const row = (action, value, ic, title, sub) => '<button class="srow" data-action="' + action + '"' + (value ? ' data-value="' + value + '"' : "") + '><span class="sic">' + icon(ic, 20) + '</span><span class="sr-t"><b>' + title + "</b><small>" + sub + '</small></span><span class="chev">›</span></button>';

    $("#view").innerHTML =
      '<div class="page-top"><div><h1>More</h1></div></div>' +
      '<div class="hc"><h2>Focus List</h2><p>Everything is saved on this device.</p><div class="hc-stats">' +
      "<div><b>" + left + "</b><span>tasks left</span></div><div><b>" + Store.data.notes.length + "</b><span>notes</span></div><div><b>" + Store.data.projects.length + "</b><span>projects</span></div></div></div>" +
      row("open-set", "look", "sun", "Theme", st.theme === "dark" ? "Night" : "Ivory") +
      row("open-set", "clock", "clock", "Clock", st.timeFormat === "24" ? "24-hour" : "12-hour") +
      row("open-set", "rem", "bell", "Reminders", on ? "On" : "Off") +
      row("open-set", "data", "download", "Backup and restore", "Keep your data safe") +
      row("share-app", "", "share", "Share Focus List", "Send the link to a friend") +
      (!this.isInstalled() && this.installPrompt ? row("install-app", "", "phone", "Install app", "Add it to your device") : "") +
      '<input type="file" id="import-file" accept="application/json,.json" hidden>';

    $("#import-file").addEventListener("change", (event) => this.importFile(event.target.files[0]));
  },

  // Opens one settings group in a bottom sheet
  panel(name) {
    const st = Store.data.settings, on = Reminders.enabled();
    let title = "", inner = "";
    if (name === "look") {
      title = "Theme";
      const tile = (v, label, bg, fg, ac) => '<button class="theme-tile' + (st.theme === v ? " on" : "") + '" data-action="set-theme" data-value="' + v + '" style="background:' + bg + ";color:" + fg + '">' +
        '<span class="tt-bar" style="background:' + ac + '"></span><span class="tt-line" style="background:' + fg + '"></span><span class="tt-line s" style="background:' + fg + '"></span><b>' + label + "</b></button>";
      inner = '<div class="theme-row">' + tile("dark", "Night", "#04241c", "#f5eedb", "#d9b865") + tile("light", "Ivory", "#f6f0df", "#12382c", "#c9a24a") + "</div>";
    } else if (name === "clock") {
      title = "Clock";
      const opt = (v, label, ex) => '<button class="opt' + (st.timeFormat === v ? " on" : "") + '" data-action="set-timeFormat" data-value="' + v + '"><span>' + label + "</span><small>" + ex + "</small></button>";
      inner = opt("12", "12-hour", "7:30 pm") + opt("24", "24-hour", "19:30");
    } else if (name === "rem") {
      title = "Reminders";
      let text;
      if (!Reminders.supported()) text = "Not supported in this browser.";
      else if (Notification.permission === "denied") text = "Blocked in your browser settings. Allow notifications for this site to use reminders.";
      else if (on) text = "On. You will be reminded about tasks and prayers while the app is open or in the background.";
      else text = "Off. Turn on to get task and prayer reminders.";
      inner = '<div class="rcard-t"><div><b>Notifications</b><p class="muted">' + text + "</p></div>" +
        '<button class="tgl' + (on ? " on" : "") + '" role="switch" aria-checked="' + on + '" data-action="toggle-reminders" aria-label="Notifications"><i></i></button></div>' +
        '<button class="opt" data-action="test-reminder"><span>Send a test reminder</span>' + icon("bell", 18) + "</button>";
    } else {
      title = "Backup and restore";
      inner = '<p class="muted" style="margin-bottom:14px">Download a backup before clearing your browser or changing phones.</p>' +
        '<button class="opt" data-action="export-data"><span>Download backup</span>' + icon("download", 18) + "</button>" +
        '<button class="opt" data-action="import-data"><span>Restore from backup</span>' + icon("upload", 18) + "</button>" +
        '<button class="opt danger" data-action="reset-data"><span>Delete all data</span>' + icon("trash", 18) + "</button>";
    }
    Sheet.open('<h2 class="sheet-title">' + title + '</h2><div id="pnl" data-name="' + name + '">' + inner + "</div>", function (sheet) {
      $("#pnl", sheet).addEventListener("click", function (e) {
        if (e.target.closest("[data-action]")) Sheet.close();   // the choice is made, close the sheet
      });
    });
  },

  async toggleReminders() {
    if (Reminders.enabled()) Reminders.turnOff();
    else await Reminders.turnOn();
    this.render();
    this.panel("rem");
  },

  setTimeFormat(value) {
    Store.data.settings.timeFormat = value;
    Store.save();
    this.render();
  },

  setTheme(value) {
    Store.data.settings.theme = value;
    Store.save();
    Theme.apply();
    this.render();
  },

  async install() {
    if (!this.installPrompt) return;
    this.installPrompt.prompt();
    await this.installPrompt.userChoice;
    this.installPrompt = null;
    this.render();
  },

  async share() {
    const shareData = {
      title: "Focus List",
      text: "Salah & Quran tracker, tasks, notes and projects in one app.",
      url: location.href.split("#")[0]
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast("Link copied. Paste it in WhatsApp or anywhere.", "ok");
      }
    } catch (error) {
      // the user closed the share window: nothing to do
    }
  },

  exportData() {
    Notes.flush();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile("focuslist-backup-" + stamp + ".json", JSON.stringify(Store.data, null, 2), "application/json");
    toast("Backup downloaded.", "ok");
  },

  importFile(file) {
    if (!file) return;
    const reader = new FileReader();

    reader.onload = function () {
      try {
        const imported = JSON.parse(reader.result);
        const valid = imported && Array.isArray(imported.tasks) && Array.isArray(imported.notes) && Array.isArray(imported.projects);
        if (!valid) throw new Error("wrong file");

        confirmSheet("This replaces everything in the app with the backup.", "Restore", function () {
          localStorage.setItem(Store.KEY, JSON.stringify(imported));
          Store.load();
          Theme.apply();
          App.render();
          toast("Backup restored.", "ok");
        });
      } catch (error) {
        toast("That file is not a valid backup.", "error");
      }
    };
    reader.readAsText(file);
  },

  reset() {
    confirmSheet("All tasks, notes, projects and prayer records will be deleted from this device.", "Delete everything", function () {
      localStorage.removeItem(Store.KEY);
      Store.load();       // starts again with the example data
      Theme.apply();
      App.render();
      toast("All data deleted.");
    });
  }
};
