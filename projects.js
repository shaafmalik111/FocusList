/* projects.js - a kanban board per project: To do, In progress, Done
   Data: { id, name, members: [{ id, name, task, leader, done, status }], createdAt } */

const Projects = {
  cur: null,
  COLS: [["todo", "To do"], ["doing", "In progress"], ["done", "Done"]],

  find(id) { return Store.data.projects.find((p) => p.id === id); },
  st(m) { return m.status || (m.done ? "done" : "todo"); },

  render() {
    const list = Store.data.projects;
    const add = '<button class="add-btn" data-action="add-project">' + icon("plus", 18) + " New project</button>";
    const proj = this.cur ? this.find(this.cur) : null;
    const ini = (n) => esc((n || "?").charAt(0).toUpperCase());
    const ring = (pct, size) => '<span class="mring" style="width:' + size + "px;height:" + size + 'px"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="mr-t" cx="32" cy="32" r="26"/><circle class="mr-f" cx="32" cy="32" r="26" stroke-dasharray="' + (pct * 1.634).toFixed(1) + ' 163.4"/></svg><b>' + pct + "%</b></span>";
    const stats = (p) => { const ms = p.members || []; const d = ms.filter((m) => this.st(m) === "done").length; return { n: ms.length, d: d, pct: ms.length ? Math.round(d / ms.length * 100) : 0 }; };

    // ----- all projects -----
    if (!proj) {
      this.cur = null;
      if (!list.length) {
        $("#view").innerHTML = '<div class="page-top"><div><h1>Projects</h1></div>' + add + "</div>" +
          '<div class="blank"><span class="blank-arch">' + icon("users", 28) + "</span><h3>No projects yet</h3><p class=\"muted\">Create one, add your team, then give everyone tasks.</p></div>";
        return;
      }
      $("#view").innerHTML = '<div class="page-top"><div><h1>Projects</h1><p class="sub">' + list.length + (list.length === 1 ? " project" : " projects") + "</p></div>" + add + "</div>" +
        '<div class="pgrid">' + list.map((p) => {
          const t = stats(p), names = (p.members || []).map((m) => m.name).filter((v, i, a) => a.indexOf(v) === i);
          return '<button class="pc" data-id="' + p.id + '" data-action="open-project">' + ring(t.pct, 72) + "<h3>" + esc(p.name) + "</h3><small>" + t.d + " of " + t.n + " tasks done</small>" +
            '<span class="stack">' + names.slice(0, 4).map((n) => '<span class="avatar sm">' + ini(n) + "</span>").join("") + "</span></button>";
        }).join("") + "</div>";
      return;
    }

    // ----- one project, grouped by person -----
    const t = stats(proj), ms = proj.members || [];
    const lead = ms.find((m) => m.leader);
    const names = ms.map((m) => m.name).filter((v, i, a) => a.indexOf(v) === i);
    const label = { todo: "To do", doing: "In progress", done: "Done" };
    const people = names.map((name) => {
      const mine = ms.filter((m) => m.name === name), isLead = mine.some((m) => m.leader);
      const dn = mine.filter((m) => this.st(m) === "done").length;
      return '<section class="psec"><header><span class="avatar' + (isLead ? " lead" : "") + '">' + ini(name) + '</span><div class="psec-n"><b>' + esc(name) + "</b>" + (isLead ? " <em>Leader</em>" : "") + "<small>" + dn + " of " + mine.length + " done</small></div>" +
        '<button class="mini" data-action="add-task-to" data-value="' + esc(name) + '" aria-label="Add task for ' + esc(name) + '">' + icon("plus", 18) + "</button></header>" +
        '<ul class="pt-list">' + mine.map((m) => { const k = this.st(m);
          return '<li class="pt ' + k + '" data-id="' + m.id + '"><button class="stb ' + k + '" data-action="cycle-task" aria-label="Change status">' + (k === "done" ? icon("check", 14) : "") + "</button>" +
            '<div class="pt-t" data-action="edit-card"><span>' + esc(m.task || "Untitled task") + "</span><small>" + label[k] + "</small></div></li>"; }).join("") + "</ul></section>";
    }).join("");

    $("#view").innerHTML =
      '<div class="ned-top pnav"><button class="link-btn" data-action="back-projects">‹ Projects</button><span class="sp"></span>' +
      '<button class="mini" data-action="edit-project" aria-label="Edit team">' + icon("edit", 16) + '</button><button class="mini danger" data-action="delete-project" aria-label="Delete project">' + icon("trash", 16) + "</button></div>" +
      '<div class="pdet">' + ring(t.pct, 96) + '<div><h1 class="pname">' + esc(proj.name) + "</h1><p class=\"sub\">" + (lead ? "Led by " + esc(lead.name) + ". " : "") + t.d + " of " + t.n + " tasks done</p></div></div>" +
      people + '<button class="addcard" data-action="add-member">+ Add member</button>';
  },

  cycle(mid) {
    const p = this.find(this.cur), m = p && p.members.find((x) => x.id === mid);
    if (!m) return;
    const next = { todo: "doing", doing: "done", done: "todo" }[this.st(m)];
    m.status = next; m.done = next === "done";
    Store.save();
    this.render();
  },

  openCard(mid, col, preset) {
    const p = this.find(this.cur);
    if (!p) return;
    const m = mid ? p.members.find((x) => x.id === mid) : null;
    let status = m ? this.st(m) : (col || "todo");
    const names = p.members.map((x) => x.name).filter((v, i, a) => a.indexOf(v) === i);
    Sheet.open(
      '<h2 class="sheet-title">' + (m ? "Edit task" : "New task") + "</h2>" +
      '<label class="label" for="k-task">Task</label><input id="k-task" class="field" maxlength="100" placeholder="What needs doing?" autocomplete="off">' +
      '<label class="label" for="k-who">Assigned to</label><input id="k-who" class="field" list="k-names" maxlength="40" placeholder="Name" autocomplete="off">' +
      '<datalist id="k-names">' + names.map((n) => '<option value="' + esc(n) + '">').join("") + "</datalist>" +
      '<label class="label">Status</label><div class="segmented" id="k-st">' + this.COLS.map((c) => '<button type="button" data-s="' + c[0] + '" class="' + (c[0] === status ? "active" : "") + '">' + c[1] + "</button>").join("") + "</div>" +
      '<div class="sheet-actions"><button class="btn" data-sheet="close">Cancel</button><button class="btn primary" id="k-save">Save task</button></div>' +
      (m ? '<button class="btn danger block" id="k-del">Delete task</button>' : ""),
      function (sheet) {
        const task = $("#k-task", sheet), who = $("#k-who", sheet);
        if (m) { task.value = m.task || ""; who.value = m.name || ""; } else if (preset) who.value = preset;
        $("#k-st", sheet).addEventListener("click", function (e) {
          const b = e.target.closest("button");
          if (!b) return;
          status = b.dataset.s;
          sheet.querySelectorAll("#k-st button").forEach((x) => x.classList.toggle("active", x === b));
        });
        $("#k-save", sheet).addEventListener("click", function () {
          const t = task.value.trim();
          if (!t) { toast("Please type a task.", "error"); task.focus(); return; }
          const name = who.value.trim() || "Anyone";
          if (m) { m.task = t; m.name = name; m.status = status; m.done = status === "done"; }
          else p.members.push({ id: Store.uid(), name: name, task: t, leader: false, done: status === "done", status: status });
          Store.save(); Sheet.close(); Projects.render();
          toast("Task saved.", "ok");
        });
        const del = $("#k-del", sheet);
        if (del) del.addEventListener("click", function () {
          p.members = p.members.filter((x) => x.id !== m.id);
          Store.save(); Sheet.close(); Projects.render();
          toast("Task deleted.");
        });
        if (!m) setTimeout(function () { task.focus(); }, 300);
      }
    );
  },

  remove(id) {
    const project = this.find(id);
    if (!project) return;
    confirmSheet('"' + project.name + '" will be deleted.', "Delete", () => {
      Store.data.projects = Store.data.projects.filter((p) => p.id !== id);
      Store.save();
      this.render();
      toast("Project deleted.");
    });
  },

  openEditor(id) {
    const project = id ? this.find(id) : null;
    const members = project
      ? project.members.map((m) => Object.assign({}, m))
      : [{ id: Store.uid(), name: "", task: "", leader: true, done: false }, { id: Store.uid(), name: "", task: "", leader: false, done: false }];

    Sheet.open(
      '<h2 class="sheet-title">' + (project ? "Edit team" : "New project") + "</h2>" +
      '<input id="p-name" class="big-in" maxlength="60" placeholder="Project name" autocomplete="off" aria-label="Project name">' +
      '<label class="label">Team <span class="hint">tap the star to pick the leader</span></label><div id="p-members"></div>' +
      '<button class="addcard" id="p-add" type="button">+ Add member</button>' +
      '<button class="btn primary block" id="p-save">' + (project ? "Save changes" : "Create project") + "</button>" +
      '<div class="sheet-foot"><button class="link-btn" data-sheet="close">Cancel</button></div>',
      function (sheet) {
        const nameInput = $("#p-name", sheet), box = $("#p-members", sheet);
        nameInput.value = project ? project.name : "";

        function draw() {
          box.innerHTML = members.map(function (m, i) {
            return '<div class="mrow" data-i="' + i + '"><button type="button" class="star' + (m.leader ? " on" : "") + '" data-lead="' + i + '" aria-label="Team leader">★</button>' +
              '<div class="mrow-f"><input data-f="name" maxlength="40" placeholder="Name" value="' + esc(m.name) + '"><input data-f="task" class="sm" maxlength="100" placeholder="Task" value="' + esc(m.task) + '"></div>' +
              '<button class="mini danger" data-rm="' + i + '" type="button" aria-label="Remove member">' + icon("trash", 16) + "</button></div>";
          }).join("");
        }
        function sync() {
          box.querySelectorAll(".mrow").forEach(function (row) {
            const m = members[Number(row.dataset.i)];
            m.name = $('[data-f="name"]', row).value;
            m.task = $('[data-f="task"]', row).value;
          });
        }
        draw();

        box.addEventListener("click", function (e) {
          const rm = e.target.closest("[data-rm]"), st = e.target.closest("[data-lead]");
          if (rm) { sync(); members.splice(Number(rm.dataset.rm), 1); draw(); }
          if (st) { sync(); const k = Number(st.dataset.lead); members.forEach((m, i) => { m.leader = i === k && !m.leader; }); draw(); }
        });
        $("#p-add", sheet).addEventListener("click", function () {
          sync();
          members.push({ id: Store.uid(), name: "", task: "", leader: false, done: false });
          draw();
          const rows = box.querySelectorAll(".mrow input");
          if (rows.length) rows[rows.length - 2].focus();
        });
        $("#p-save", sheet).addEventListener("click", function () {
          sync();
          const name = nameInput.value.trim();
          const team = members.filter((m) => m.name.trim()).map((m) => ({ id: m.id, name: m.name.trim(), task: m.task.trim(), leader: !!m.leader, done: !!m.done, status: m.status }));
          if (!name) { toast("Please type a project name.", "error"); nameInput.focus(); return; }
          if (!team.length) { toast("Add at least one member with a name.", "error"); return; }
          Projects.save(project, name, team);
        });
        if (!project) setTimeout(function () { nameInput.focus(); }, 300);
      }
    );
  },

  save(project, name, team) {
    if (project) { project.name = name; project.members = team; }
    else { const np = { id: Store.uid(), name: name, members: team, createdAt: Date.now() }; Store.data.projects.push(np); this.cur = np.id; }
    Store.save();
    Sheet.close();
    this.render();
    toast(project ? "Project updated." : "Project created.", "ok");
  }
};
