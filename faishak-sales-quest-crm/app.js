const defaults = {
  xp: 0,
  day: 18,
  done: [],
  skills: {
    "BCI & Qualification": 20,
    "Product Knowledge": 15,
    "Cold Calling": 10,
    Discovery: 10,
    Negotiation: 5,
    Closing: 5,
  },
  opps: [],
};
let s = readSavedState() || defaults;
const quests = [
  [
    "🔎",
    "Qualify 5 new projects",
    "Choose the most relevant sectors; confirm package, timing, buyer and ownership.",
    "100",
  ],
  [
    "☎️",
    "3 buyer-identification calls",
    "Goal: find who controls the relevant package.",
    "120",
  ],
  [
    "📚",
    "Application drill",
    "Learn one customer problem and the evidence you need before claiming performance.",
    "50",
  ],
  [
    "",
    "Customer Practice",
    "Complete one simulated customer conversation.",
    "100",
  ],
];
function save() {
  localStorage.setItem("fsq", JSON.stringify(s));
  render();
}
function filterEvents(tag, btn) {
  document
    .querySelectorAll(".filters button")
    .forEach((b) => b.classList.remove("on"));
  btn.classList.add("on");
  document.querySelectorAll("#eventList .event").forEach((e) => {
    e.classList.toggle(
      "hidden",
      tag !== "all" && !e.dataset.tags.split(" ").includes(tag),
    );
  });
}
function eventQuest(btn, name) {
  let e = btn.closest(".event");
  e.classList.toggle("quested");
  let on = e.classList.contains("quested");
  btn.textContent = on ? "✓ In My Quest" : "➕ Add to Quest";
  let q = JSON.parse(localStorage.getItem("eventQuests") || "[]");
  q = on ? [...new Set([...q, name])] : q.filter((x) => x !== name);
  localStorage.setItem("eventQuests", JSON.stringify(q));
}
function addXP(n, label) {
  s.xp += n;
  alert("+" + n + " points · " + label);
  save();
}
function render() {
  let level = Math.floor(s.xp / 500) + 1,
    cur = s.xp % 500;
  xpTop.textContent = s.xp + " pts";
  levelTop.textContent = level;
  xpbar.style.width = cur / 5 + "%";
  xptext.textContent =
    "90-day activity progress · " + cur + " points this stage";
  dayKpi.textContent = s.day + " / 90";
  completeKpi.textContent =
    Math.round((s.done.length / quests.length) * 100) + "%";
  xpKpi.textContent = s.xp;
  doneKpi.textContent = s.done.length;
  rank.textContent =
    level < 4
      ? "PROJECT HUNTER"
      : level < 8
        ? "SOLUTION SELLER"
        : "PROJECT CLOSER";
  questList.innerHTML = quests
    .map(
      (q, i) =>
        `<div class='quest ${s.done.includes(i) ? "done" : ""}'><div class='icon'>${q[0]}</div><div style='flex:1'><b>${q[1]}</b><div class='muted mini'>${q[2]}</div><span class='pill'>+${q[3]} pts</span></div>${s.done.includes(i) ? "✓" : `<button onclick='completeQuest(${i})'>Complete</button>`}</div>`,
    )
    .join("");
  let total = s.opps.reduce((a, o) => a + o.value, 0);
  pipeKpi.textContent = total.toLocaleString();
  pipeKpi2.textContent = total.toLocaleString();
  skills.innerHTML = Object.entries(s.skills)
    .map(
      ([k, v]) =>
        `<div class='skill'><div class='skillline'><b>${k}</b><span>${v}%</span></div><div class='score'><i style='width:${v}%'></i></div></div>`,
    )
    .join("");
  opps.innerHTML =
    s.opps
      .map(
        (o) =>
          `<div class='quest'><div><b>${escapeHTML(o.name)}</b><div class='mini muted'>${escapeHTML(o.stage)} · $${o.value.toLocaleString()}</div></div></div>`,
      )
      .join("") || '<p class="muted mini">No opportunities yet.</p>';
}
function completeQuest(i) {
  if (!s.done.includes(i)) {
    s.done.push(i);
    s.xp += +quests[i][3];
    let keys = Object.keys(s.skills);
    s.skills[keys[Math.min(i, keys.length - 1)]] = Math.min(
      100,
      s.skills[keys[Math.min(i, keys.length - 1)]] + 5,
    );
    save();
  }
}
document.querySelectorAll(".side button[data-v]").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll(".side button")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.remove("active"));
      document.getElementById(b.dataset.v).classList.add("active");
    }),
);
document
  .querySelectorAll(".jump")
  .forEach(
    (b) =>
      (b.onclick = () =>
        document
          .querySelector(`.side button[data-v='${b.dataset.go}']`)
          .click()),
  );
const recipes = {
  awarded: `PROJECTS ROUTE — AWARDED CONTRACTOR\n\nProjects\n→ Project Location: Singapore\n→ Categories: start with ONE sector (e.g. Health or Education)\n→ Stage & Status: Pre-Construction + Construction\n→ Date Range: Last Updated within 60 days\n→ Blue down-arrow → Contract Details\n→ Main Contractor Appointed: YES\n→ Leave Main Contractor Listed separate\n→ No keyword / hard value threshold initially\n→ Search\n\nReview 5 results. Confirm door scope, package buyer and timing.`,
  specifier: `EARLIER DESIGN / SPECIFIER ROUTE\n\nProjects\n→ Project Location: Singapore\n→ Choose one sector\n→ Stage & Status: Concept + Design & Documentation\n→ Date Range: recent updates\n→ Search broad first\n\nOpen relevant projects and identify architect / consultant / specifier roles. Objective: understand specification timing and application — not force a product pitch.`,
  company: `COMPANIES ROUTE\n\nCompanies\n→ Search contractor/company name\n→ Open matching company\n→ Projects & Contacts\n→ Contract Status: test Contract Won and Currently Tendering separately\n→ Active projects\n\nRemember: Company Location ≠ Project Location. Check project relevance and Lucas ownership before outreach.`,
  keyword: `KEYWORD TESTS\n\nClick Keyword(s) → enter terms → Done → Search\n\nExact phrase: "door hardware"\nAlternatives: renovation, refurbishment, "fit out", "fit-out"\nTests: door / ironmongery / "fire door" / "smoke seal" / acoustic / soundproof / "sliding door" / "pocket door"\n\nKeep broad searches WITHOUT product keywords too. Keywords are exploratory, not proven lead recipes.`,
};
function showRecipe(k) {
  recipe.textContent = recipes[k];
}
showRecipe("awarded");
function startSim() {
  let p = persona.value,
    d = difficulty.value;
  simTitle.textContent = p + " · " + d;
  let lines = d.startsWith("Easy")
    ? "Yes, I have a few minutes. What do you supply?"
    : d.startsWith("Normal")
      ? "I am rushing. Just send me your catalogue."
      : d.startsWith("Hard")
        ? "We already have another brand specified for this project."
        : d.startsWith("Expert")
          ? "Your competitor is cheaper. Why should I pay more?"
          : "Bro, already got supplier. Just email me lah.";
  customerLine.innerHTML = "<b>Customer:</b> “" + lines + "”";
  reply.value = "";
  feedback.innerHTML = "";
}
function scoreSim() {
  let t = reply.value.toLowerCase(),
    score = 35,
    notes = [];
  if (t.includes("?")) {
    score += 15;
    notes.push("✓ You asked a question instead of only pitching.");
  }
  if (/understand|sounds like|seems|appreciate/.test(t)) {
    score += 10;
    notes.push("✓ You acknowledged the customer position.");
  }
  if (/project|package|requirement|spec|timing|currently|reason/.test(t)) {
    score += 15;
    notes.push("✓ You moved toward project discovery.");
  }
  if (/next|meeting|review|send|follow up|who handles|who is/.test(t)) {
    score += 15;
    notes.push("✓ You attempted a concrete next step.");
  }
  if (/best|better than|guarantee|definitely/.test(t)) {
    score -= 15;
    notes.push("⚠ Avoid unsupported superiority/performance claims.");
  }
  score = Math.max(0, Math.min(100, score));
  feedback.innerHTML = `<h3>${score >= 75 ? "Practice complete" : "🧠 COACHING"} · ${score}/100</h3><p>${notes.join("<br>") || "Try acknowledging the customer, asking a calibrated discovery question and earning a specific next step."}</p><p class='mini muted'>Frameworks used for coaching: discovery before pitching, tactical empathy/calibrated questions, current-state → problem → implication → next step. This is training guidance, not a magic script.</p>`;
  if (score >= 75) {
    s.xp += 100;
    s.skills["Discovery"] = Math.min(100, s.skills["Discovery"] + 5);
    save();
  }
}
function addOpp() {
  let name = oppName.value.trim(),
    v = +oppValue.value;
  if (!name || !Number.isFinite(v) || v <= 0)
    return alert("Add a project/account and a positive estimated value.");
  s.opps.push({
    id: crypto.randomUUID(),
    name,
    value: v,
    stage: oppStage.value,
  });
  s.xp += 50;
  oppName.value = "";
  oppValue.value = "";
  save();
}
render();

function navigate(id) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.toggle("active", v.id === id));
  document
    .querySelectorAll(".side button")
    .forEach((b) => b.classList.toggle("active", b.dataset.v === id));
  if (id === "coaching") coachingSkills.innerHTML = skills.innerHTML;
  window.scrollTo(0, 0);
}
document
  .querySelectorAll("[data-go]")
  .forEach((b) => (b.onclick = () => navigate(b.dataset.go)));
document
  .querySelectorAll(".side button[data-v]")
  .forEach((b) => (b.onclick = () => navigate(b.dataset.v)));
document.querySelectorAll("[data-quest]").forEach((c) => {
  c.checked = JSON.parse(
    localStorage.getItem("dashboard-quests") || "[]",
  ).includes(c.dataset.quest);
  c.onchange = () =>
    localStorage.setItem(
      "dashboard-quests",
      JSON.stringify(
        [...document.querySelectorAll("[data-quest]:checked")].map(
          (e) => e.dataset.quest,
        ),
      ),
    );
});
let currentChannel = "Email";
function setOutreach(channel) {
  currentChannel = channel;
  outreachTitle.textContent = "Project introduction · " + channel;
  let project = outreachProject.value || "your current project";
  outreachText.value =
    channel === "Call"
      ? `Hi, I’m Syafiee from Faishak. May I ask who handles the door hardware and sealing package for ${project}? What is the best next step to understand your requirements?`
      : channel === "WhatsApp"
        ? `Hi, thank you for speaking with me about ${project}. As agreed, may I share the relevant application information for your review?`
        : channel === "Follow-up"
          ? `Hi, following up on ${project}. Has the package timing or specification changed? Would a brief requirements review be useful this week?`
          : `Subject: Door hardware and sealing requirements — ${project}

Hi, I’m Syafiee from Faishak. We support door sealing, hardware and entrance applications. May I check who owns this scope on ${project}, and whether the package is still open for review?

Thank you,
Syafiee`;
}
setOutreach("Email");
projectNotes.value = localStorage.getItem("fsq-project-notes") || "";
globalSearch.oninput = () => {
  let q = globalSearch.value.toLowerCase();
  document
    .querySelectorAll(".module")
    .forEach((m) => (m.hidden = q && !m.textContent.toLowerCase().includes(q)));
};
globalSearch.onkeydown = (e) => {
  if (e.key === "Enter") {
    let m = [...document.querySelectorAll(".module")].find((m) => !m.hidden);
    if (m) navigate(m.dataset.go);
  }
};
notifications.onclick = () => {
  let el = document.getElementById("notificationPanel");
  if (el) {
    el.remove();
    return;
  }
  el = document.createElement("div");
  el.id = "notificationPanel";
  el.style =
    "position:absolute;right:25px;top:60px;background:white;padding:20px;box-shadow:0 8px 30px #0002;border-radius:10px;z-index:10";
  el.textContent = "Today: 3 sales objectives · Next event: SCAL Annual Dinner";
  document.body.append(el);
};
customise.onclick = () => {
  let compact = document.querySelector(".modules").classList.toggle("compact");
  document
    .querySelectorAll(".module small")
    .forEach((e) => (e.hidden = compact));
  customise.textContent = compact
    ? "Show Module Details ›"
    : "Customise Modules ›";
};

const suppliedHandlers = [
  function (event) {
    showRecipe("awarded");
  },
  function (event) {
    showRecipe("specifier");
  },
  function (event) {
    showRecipe("company");
  },
  function (event) {
    showRecipe("keyword");
  },
  function (event) {
    startSim();
  },
  function (event) {
    scoreSim();
  },
  function (event) {
    filterEvents("all", this);
  },
  function (event) {
    filterEvents("free", this);
  },
  function (event) {
    filterEvents("contractor", this);
  },
  function (event) {
    filterEvents("specifier", this);
  },
  function (event) {
    filterEvents("fm", this);
  },
  function (event) {
    filterEvents("indirect", this);
  },
  function (event) {
    eventQuest(this, "SCAL Annual Dinner");
  },
  function (event) {
    eventQuest(this, "SCAL AI & MCP");
  },
  function (event) {
    eventQuest(this, "SGBC PDD Learning Journey");
  },
  function (event) {
    eventQuest(this, "SGBC Energy Modelling");
  },
  function (event) {
    eventQuest(this, "SGBC Vector Green");
  },
  function (event) {
    eventQuest(this, "SCAL SME WSH");
  },
  function (event) {
    eventQuest(this, "SGBC AIoT Journey");
  },
  function (event) {
    eventQuest(this, "SIEW 2026");
  },
  function (event) {
    addXP(100, "Event follow-up completed");
  },
  function (event) {
    addOpp();
  },
  function (event) {
    setOutreach("Email");
  },
  function (event) {
    setOutreach("Call");
  },
  function (event) {
    setOutreach("WhatsApp");
  },
  function (event) {
    setOutreach("Follow-up");
  },
  function (event) {
    setOutreach(currentChannel);
  },
  function (event) {
    navigator.clipboard
      .writeText(outreachText.value)
      .then(() => (this.textContent = "Copied"));
  },
  function (event) {
    localStorage.setItem("fsq-project-notes", projectNotes.value);
    this.textContent = "Notes saved";
  },
];
for (const eventName of ["click", "input", "change"])
  document.querySelectorAll(`[data-handler-${eventName}]`).forEach((el) =>
    el.addEventListener(eventName, function (event) {
      suppliedHandlers[
        Number(this.getAttribute(`data-handler-${eventName}`))
      ].call(this, event);
    }),
  );

const legacyRender = render;
render = function () {
  legacyRender();
  renderDashboard();
  renderOpportunityManager();
  if (document.querySelector("#coaching.active"))
    coachingSkills.innerHTML = skills.innerHTML;
};

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
function initializeSalesData() {
  const fresh = !localStorage.getItem("fsq");
  if (fresh) {
    s.opps = [
      ["Ng Teng Fong Hospital — Door hardware", 55000, "Qualified"],
      ["Education campus — Sealing package", 40000, "Qualified"],
      ["Commercial fit-out — Ironmongery", 35000, "Qualified"],
      ["Residential development — Entrance systems", 30000, "Qualified"],
      ["Healthcare refurbishment — Access control", 25000, "Qualified"],
      ["Hospital extension — RFQ", 90000, "RFQ"],
      ["Office redevelopment — RFQ", 70000, "RFQ"],
      ["School campus — RFQ", 50000, "RFQ"],
      ["Mixed-use development — Quote", 65000, "Quoted"],
      ["Hotel refurbishment — Quote", 55000, "Quoted"],
    ].map(([name, value, stage]) => ({
      id: crypto.randomUUID(),
      name,
      value,
      stage,
    }));
    s.meetings = [
      {
        id: crypto.randomUUID(),
        name: "Main contractor — Package discovery",
        done: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Architect — Specification review",
        done: true,
      },
    ];
    s.qualifiedProjects = Array.from({ length: 14 }, (_, i) => ({
      id: crypto.randomUUID(),
      name: "Qualified project " + String(i + 1).padStart(2, "0"),
      done: true,
    }));
    s.meetingTarget = 3;
    s.projectTarget = 20;
    s.planProgress = 0;
    s.pipelineBaseline = 185000 / 1.28;
    s.demoData = true;
  }
  s.meetings ??= [];
  s.qualifiedProjects ??= [];
  s.meetingTarget ??= 3;
  s.projectTarget ??= 20;
  s.planProgress ??= 0;
  s.pipelineBaseline ??= 0;
  s.opps = s.opps
    .filter(
      (o) =>
        o && typeof o.name === "string" && Number.isFinite(Number(o.value)),
    )
    .map((o) => ({
      ...o,
      id: o.id || crypto.randomUUID(),
      value: Number(o.value),
    }));
  localStorage.setItem("fsq", JSON.stringify(s));
}
function salesMetrics() {
  const qualified = s.opps.filter((o) =>
    ["Qualified", "Meeting"].includes(o.stage),
  );
  const rfqs = s.opps.filter((o) => o.stage === "RFQ"),
    quotes = s.opps.filter((o) => o.stage === "Quoted");
  const sum = (rows) => rows.reduce((total, o) => total + o.value, 0);
  return {
    qualified: sum(qualified),
    active: qualified.length,
    meetings: s.meetings.filter((m) => m.done).length,
    projects: s.qualifiedProjects.filter((p) => p.done).length,
    rfq: rfqs.length,
    rfqValue: sum(rfqs),
    quotes: quotes.length,
    quoteValue: sum(quotes),
  };
}
const money = (value) =>
  "S$ " + value.toLocaleString("en-SG", { maximumFractionDigits: 0 });
function renderDashboard() {
  const m = salesMetrics();
  const definitions = {
    qualified: [money(m.qualified), m.active + " active opportunities"],
    meetings: [`${m.meetings} <em>/ ${s.meetingTarget}</em>`, "Weekly target"],
    projects: [
      `${m.projects} <em>/ ${s.projectTarget}</em>`,
      Math.round((m.projects / s.projectTarget) * 100) + "% of target",
    ],
    rfq: [String(m.rfq), "Value: " + money(m.rfqValue)],
    quotes: [String(m.quotes), "Value: " + money(m.quoteValue)],
  };
  document.querySelectorAll("[data-metric]").forEach((card) => {
    const metric = card.dataset.metric,
      [value, label] = definitions[metric];
    card.querySelector(".metric-value").innerHTML = value;
    card.querySelector("small").textContent = label;
    card.setAttribute(
      "aria-label",
      card.querySelector(".kpi-label").textContent +
        " · " +
        value.replace(/<[^>]+>/g, "") +
        " · Manage",
    );
    const trend = card.querySelector(".kpi-trend");
    if (metric === "qualified") {
      trend.textContent =
        s.pipelineBaseline > 0
          ? "↑ " +
            (m.qualified >= s.pipelineBaseline ? "+" : "") +
            Math.round((m.qualified / s.pipelineBaseline - 1) * 100) +
            "%"
          : "›";
      trend.classList.toggle("negative", m.qualified < s.pipelineBaseline);
    } else if (metric === "meetings" || metric === "projects") {
      const pct = Math.min(
        100,
        100 *
          (metric === "meetings"
            ? m.meetings / s.meetingTarget
            : m.projects / s.projectTarget),
      );
      trend.style.setProperty("--ring-progress", pct + "%");
    } else {
      trend.innerHTML =
        '<svg class="mini-bars" viewBox="0 0 24 28" aria-hidden="true"><rect x="1" y="17" width="5" height="10" rx="1"/><rect x="9" y="10" width="5" height="17" rx="1"/><rect x="17" y="2" width="5" height="25" rx="1"/></svg>';
    }
  });
  document.querySelector(".progress-number").textContent = s.planProgress + "%";
  document.querySelector(".welcome>p").textContent =
    "Day " + s.day + " of your 90-day sales journey";
  let badge = document.getElementById("dataMode");
  if (!badge) {
    badge = document.createElement("span");
    badge.id = "dataMode";
    document.querySelector(".footer").prepend(badge);
  }
  badge.textContent = s.demoData
    ? "Sample workspace · Edit cards to update the records. "
    : "Browser-saved workspace · ";
}
function persistSales(message) {
  localStorage.setItem("fsq", JSON.stringify(s));
  render();
  if (message) showToast(message);
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}
function renderOpportunityManager() {
  const container = document.getElementById("opportunityManager");
  if (!container) return;
  container.innerHTML =
    '<h3 class="sectionTitle">Opportunity records</h3>' +
    opportunityRows(s.opps);
  bindOpportunityRows(container);
}
const stages = [
  "Qualified",
  "Meeting",
  "RFQ",
  "Quoted",
  "Negotiation",
  "Won",
  "Lost",
];
function opportunityRows(rows) {
  return rows.length
    ? rows
        .map(
          (o) =>
            `<div class="record-row"><div><b>${escapeHTML(o.name)}</b><small>${money(o.value)}</small></div><select aria-label="Stage for ${escapeHTML(o.name)}" data-stage="${o.id}">${stages.map((stage) => `<option ${stage === o.stage ? "selected" : ""}>${stage}</option>`).join("")}</select><button class="delete-record" data-delete-opp="${o.id}" aria-label="Remove ${escapeHTML(o.name)}">×</button></div>`,
        )
        .join("")
    : '<p class="empty-state">No records yet. Add an opportunity in Pipeline.</p>';
}
function bindOpportunityRows(container) {
  container.querySelectorAll("[data-stage]").forEach(
    (el) =>
      (el.onchange = () => {
        const o = s.opps.find((o) => o.id === el.dataset.stage);
        if (o) {
          o.stage = el.value;
          persistSales("Opportunity stage updated");
          if (metricDialog.open) openMetric(activeMetric, false);
        }
      }),
  );
  container.querySelectorAll("[data-delete-opp]").forEach(
    (el) =>
      (el.onclick = () => {
        const record = s.opps.find((o) => o.id === el.dataset.deleteOpp);
        s.opps = s.opps.filter((o) => o.id !== el.dataset.deleteOpp);
        persistSales("Opportunity removed");
        if (metricDialog.open) openMetric(activeMetric, false);
        const undo = document.createElement("button");
        undo.textContent = "Undo";
        undo.onclick = () => {
          s.opps.push(record);
          persistSales("Opportunity restored");
          if (metricDialog.open) openMetric(activeMetric, false);
        };
        toast.append(" ", undo);
      }),
  );
}
let activeMetric = "qualified";
function openMetric(metric, show = true) {
  activeMetric = metric;
  const labels = {
    qualified: "Qualified Pipeline",
    meetings: "Meetings",
    projects: "Projects Qualified",
    rfq: "RFQs in Progress",
    quotes: "Quotes Submitted",
  };
  metricTitle.textContent = labels[metric];
  const content = document.getElementById("metricContent");
  if (["qualified", "rfq", "quotes"].includes(metric)) {
    const rows = s.opps.filter((o) =>
      metric === "qualified"
        ? ["Qualified", "Meeting"].includes(o.stage)
        : o.stage === (metric === "rfq" ? "RFQ" : "Quoted"),
    );
    content.innerHTML =
      '<p class="muted">These values are calculated from your saved opportunity records. Change a stage to update the cards.</p>' +
      opportunityRows(rows) +
      '<button id="metricPipeline" class="primary wide">Manage all opportunities →</button>';
    bindOpportunityRows(content);
    document.getElementById("metricPipeline").onclick = () => {
      metricDialog.close();
      navigate("pipeline");
    };
  } else {
    const isMeeting = metric === "meetings",
      records = isMeeting ? s.meetings : s.qualifiedProjects,
      target = isMeeting ? s.meetingTarget : s.projectTarget;
    content.innerHTML = `<p class="muted">${isMeeting ? "Completed meetings this week" : "Projects that passed the qualification gate"} / target. Changes are saved in this browser.</p><label class="target-label">Target <input id="metricTarget" type="number" min="1" max="10000" value="${target}"></label><div class="metric-records">${records.map((r) => `<div class="record-row"><label><input type="checkbox" data-record-check="${r.id}" ${r.done ? "checked" : ""}> ${escapeHTML(r.name)}</label><button class="delete-record" data-record-delete="${r.id}" aria-label="Remove ${escapeHTML(r.name)}">×</button></div>`).join("") || '<p class="empty-state">No completed records yet.</p>'}</div><form id="metricForm"><label>New ${isMeeting ? "meeting" : "qualified project"}<input id="metricRecordName" required maxlength="160" placeholder="Project / company and objective"></label><button class="primary" type="submit">Add completed record</button></form>`;
    document.getElementById("metricTarget").onchange = (e) => {
      const n = Number(e.target.value);
      if (!Number.isInteger(n) || n < 1 || n > 10000) {
        e.target.value = target;
        return;
      }
      if (isMeeting) s.meetingTarget = n;
      else s.projectTarget = n;
      persistSales("Target updated");
    };
    content.querySelectorAll("[data-record-check]").forEach(
      (el) =>
        (el.onchange = () => {
          records.find((r) => r.id === el.dataset.recordCheck).done =
            el.checked;
          persistSales("Record updated");
        }),
    );
    content.querySelectorAll("[data-record-delete]").forEach(
      (el) =>
        (el.onclick = () => {
          if (isMeeting)
            s.meetings = records.filter(
              (r) => r.id !== el.dataset.recordDelete,
            );
          else
            s.qualifiedProjects = records.filter(
              (r) => r.id !== el.dataset.recordDelete,
            );
          persistSales("Record removed");
          openMetric(metric, false);
        }),
    );
    document.getElementById("metricForm").onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("metricRecordName").value.trim();
      if (!name) return;
      records.push({
        id: crypto.randomUUID(),
        name,
        done: true,
        date: todaySG(),
      });
      persistSales("Completed record added");
      openMetric(metric, false);
    };
  }
  if (show && !metricDialog.open) metricDialog.showModal();
}
document
  .querySelectorAll("[data-metric]")
  .forEach((card) => (card.onclick = () => openMetric(card.dataset.metric)));
document.getElementById("closeMetric").onclick = () => metricDialog.close();
metricDialog.addEventListener("click", (e) => {
  if (e.target === metricDialog) {
    const r = metricDialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      metricDialog.close();
  }
});

initializeSalesData();
render();

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem("fsq") || "null");
    if (!saved || typeof saved !== "object") return null;
    return {
      ...defaults,
      ...saved,
      done: Array.isArray(saved.done) ? saved.done : [],
      opps: Array.isArray(saved.opps) ? saved.opps : [],
      skills: { ...defaults.skills, ...saved.skills },
    };
  } catch {
    return null;
  }
}
