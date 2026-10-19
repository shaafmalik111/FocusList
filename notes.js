/* notes.js - a wall of sticky notes; tap one to open it full screen */

const Notes = {
  cur: null, q: "", saveTimer: null,
  COLORS: ["#fff1a8", "#ffd3bd", "#cdeccb", "#cde4ff", "#e3d6ff", "#ffffff"],

  init() {},
  find(id) { return Store.data.notes.find((n) => n.id === id); },
  label(n) { return (n.title || "").trim() || "Untitled"; },
  text(n) { const d = document.createElement("div"); d.innerHTML = (n.html || "").replace(/<\/(li|p|h[1-6]|div)>|<br\s*\/?>/gi, " $&"); return (d.textContent || "").trim(); },
  paper(n) { return n.bg || this.COLORS[0]; },
  ink(hex) {
    const v = (i) => parseInt(hex.slice(i, i + 2), 16);
    return (v(1) * 299 + v(3) * 587 + v(5) * 114) / 1000 > 140 ? "#1f2937" : "#f3f4f6";
  },

  render() {
    $("#view").innerHTML =
      '<div class="page-top"><div><h1>Notes</h1><p class="sub">' + Store.data.notes.length + " on your wall</p></div></div>" +
      '<input id="nsearch" class="field" type="search" placeholder="Search notes" value="' + esc(this.q) + '">' +
      '<div id="wall"></div>' +
      '<button class="fab" data-action="new-note" aria-label="New note">' + icon("plus", 26) + "</button>";
    $("#nsearch").addEventListener("input", (e) => { this.q = e.target.value; this.drawWall(); });
    this.drawWall();
  },

  drawWall() {
    const q = this.q.toLowerCase();
    const list = Store.data.notes
      .filter((n) => !q || (this.label(n) + " " + this.text(n)).toLowerCase().includes(q))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
    $("#wall").innerHTML = list.length
      ? '<div class="wall">' + list.map((n) => {
          const bg = this.paper(n);
          return '<article class="nc' + (n.pinned ? " pin" : "") + '" data-id="' + n.id + '" data-action="open-note" style="background:' + bg + ";color:" + this.ink(bg) + '">' +
            "<h3>" + esc(this.label(n)) + "</h3><p>" + esc(this.text(n).slice(0, 200)) + "</p><small>" +
            new Date(n.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) + "</small></article>";
        }).join("") + "</div>"
      : '<div class="blank"><span class="blank-arch">' + icon("fileText", 28) + "</span><h3>" + (q ? "No matches" : "Your wall is empty") + '</h3><p class="muted">' + (q ? "Try a different word." : "Tap + to stick up your first note.") + "</p></div>";
  },

  openNote(id) {
    const n = this.find(id);
    if (!n) return;
    this.cur = n;
    const el = document.createElement("div");
    el.id = "ned"; el.className = "ned";
    el.innerHTML =
      '<div class="ned-in"><div class="ned-top"><button class="link-btn" data-action="close-note">‹ Notes</button><span class="sp"></span>' +
      '<button class="link-btn" id="ned-pin" data-action="pin-note">' + (n.pinned ? "Unpin" : "Pin") + "</button>" +
      '<button class="mini" data-action="download-txt" aria-label="Download as text">' + icon("download", 18) + "</button>" +
      '<button class="mini" data-action="delete-note" aria-label="Delete note">' + icon("trash", 18) + "</button></div>" +
      '<input id="ned-title" class="ned-title" maxlength="60" placeholder="Title" autocomplete="off">' +
      '<div id="ned-body" class="ned-body" contenteditable="true" spellcheck="true" data-placeholder="Write something..."></div>' +
      '<div id="ned-bar" class="ned-bar">' +
      '<button class="tool" data-cmd="bold" aria-label="Bold"><b>B</b></button><button class="tool" data-cmd="italic" aria-label="Italic"><i>I</i></button>' +
      '<button class="tool" data-cmd="h" aria-label="Heading">H</button><button class="tool" data-cmd="insertUnorderedList" aria-label="Bullet list">' + icon("list", 20) + "</button>" +
      '<span class="tool-sep"></span>' + this.COLORS.map((c) => '<button class="sw" data-bg="' + c + '" style="background:' + c + '" aria-label="Note color"></button>').join("") +
      "</div></div>";
    document.body.appendChild(el);
    document.body.classList.add("no-scroll");

    const ed = $("#ned-body"), ti = $("#ned-title");
    ti.value = n.title || ""; ed.innerHTML = n.html || "";
    this.recolor();
    ed.addEventListener("input", () => { n.html = ed.innerHTML; this.queueSave(); });
    ti.addEventListener("input", () => { n.title = ti.value; this.queueSave(); });
    ed.addEventListener("paste", (e) => {
      e.preventDefault();
      document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
    });
    const bar = $("#ned-bar");
    bar.addEventListener("mousedown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.cmd) {
        ed.focus();
        if (b.dataset.cmd === "h") document.execCommand("formatBlock", false, String(document.queryCommandValue("formatBlock")).toLowerCase() === "h2" ? "p" : "h2");
        else document.execCommand(b.dataset.cmd);
        n.html = ed.innerHTML; this.queueSave();
      } else if (b.dataset.bg) {
        n.bg = b.dataset.bg; this.recolor(); this.queueSave();
      }
    });
    if (!n.title && !this.text(n)) setTimeout(() => ti.focus(), 200);
  },

  recolor() {
    const el = $("#ned"), n = this.cur;
    if (!el || !n) return;
    const bg = this.paper(n);
    el.style.background = bg; el.style.color = this.ink(bg);
    el.querySelectorAll(".sw").forEach((s) => s.classList.toggle("on", s.dataset.bg === bg));
  },

  closeNote() {
    const n = this.cur;
    clearTimeout(this.saveTimer);
    if (n && !(n.title || "").trim() && !this.text(n)) Store.data.notes = Store.data.notes.filter((x) => x.id !== n.id);   // empty notes disappear
    else if (n) n.updatedAt = Date.now();
    Store.save();
    const el = $("#ned");
    if (el) el.remove();
    document.body.classList.remove("no-scroll");
    this.cur = null;
    this.render();
  },

  addNew() {
    const n = { id: Store.uid(), title: "", html: "", bg: this.COLORS[0], pinned: false, updatedAt: Date.now() };
    Store.data.notes.push(n);
    Store.save();
    this.openNote(n.id);
  },

  togglePin() {
    const n = this.cur;
    if (!n) return;
    n.pinned = !n.pinned;
    $("#ned-pin").textContent = n.pinned ? "Unpin" : "Pin";
    this.queueSave();
  },

  remove() {
    const n = this.cur;
    if (!n) return;
    confirmSheet('"' + this.label(n) + '" will be deleted.', "Delete", () => {
      Store.data.notes = Store.data.notes.filter((x) => x.id !== n.id);
      this.cur = null;
      const el = $("#ned");
      if (el) el.remove();
      document.body.classList.remove("no-scroll");
      Store.save();
      this.render();
      toast("Note deleted.");
    });
  },

  downloadText() {
    const n = this.cur;
    if (!n) return;
    downloadFile((this.label(n).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "note") + ".txt", this.label(n) + "\n\n" + $("#ned-body").innerText, "text/plain");
  },

  queueSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => { if (this.cur) this.cur.updatedAt = Date.now(); Store.save(); }, 400);
  },

  flush() { clearTimeout(this.saveTimer); Store.save(); }
};
