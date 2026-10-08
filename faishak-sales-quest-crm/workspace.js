/* Connected sales workspace. No secret API keys are stored in the browser. */
const byId = (id) => document.getElementById(id);
const todaySG = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const plainList = (values) =>
  "<ul>" +
  (Array.isArray(values) ? values : [])
    .map((value) => "<li>" + escapeHTML(value) + "</li>")
    .join("") +
  "</ul>";
const externalURL = (value) => {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
const sourceLinks = (sources) =>
  (Array.isArray(sources) ? sources : [])
    .filter((source) => externalURL(source.url))
    .map(
      (source) =>
        `<a href="${escapeHTML(externalURL(source.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.title || source.url)} ↗</a>`,
    )
    .join(" · ");
function normalizeWorkspace() {
  s.planObjectives ??= {};
  s.meetings.forEach((m) => {
    m.date ??= s.demoData ? todaySG() : "";
  });
  s.planStartDate ??= "";
  s.dailyQuests ??= JSON.parse(
    localStorage.getItem("dashboard-quests") || "[]",
  );
  if (s.dailyQuestDate && s.dailyQuestDate !== todaySG()) s.dailyQuests = [];
  s.dailyQuestDate = todaySG();
  s.competitors ??= [];
  s.events ??= [];
  s.brief ??= {};
  s.practice ??= { history: [], interest: 30, closed: false };
  s.mrtNotes ??= "";
  s.opps.forEach((o) => {
    o.company ??= "";
    o.contact ??= "";
    o.nextAction ??= "";
    o.dueDate ??= "";
    o.updates ??= [];
    o.lastUpdated ??= "";
    o.attention ??= "";
  });
}
normalizeWorkspace();
let accountEpoch = 0;
let cloud = {
  config: null,
  session: null,
  revision: null,
  ready: false,
  conflict: false,
  timer: null,
  saving: false,
  pending: false,
  accountMessage: "",
};
const beforeWorkspaceRender = render;
render = function () {
  s.planProgress = Math.round(
    (100 *
      salesKnowledge.objectives.filter((o) => s.planObjectives[o.id]).length) /
      salesKnowledge.objectives.length,
  );
  beforeWorkspaceRender();
  renderPlan();
  renderHomeCoaching();
  renderPipelineRecords();
  if (cloud.ready) scheduleCloudSave();
};
function renderPlan() {
  const done = salesKnowledge.objectives.filter(
    (o) => s.planObjectives[o.id],
  ).length;
  const elapsed = s.planStartDate
    ? Math.max(
        1,
        Math.floor(
          (Date.parse(todaySG()) - Date.parse(s.planStartDate)) / 86400000,
        ) + 1,
      )
    : null;
  s.day = elapsed ? Math.min(90, elapsed) : 1;
  document.querySelector(".welcome>p").textContent = elapsed
    ? "Day " + Math.min(elapsed, 90) + " of your 90-day sales journey"
    : "Start your 90-day sales journey";
  byId("planExplanation").textContent =
    done +
    " of " +
    salesKnowledge.objectives.length +
    " required objectives complete";
  byId("planStartDate").value = s.planStartDate;
  byId("planSummary").textContent =
    `Plan completion: ${done}/${salesKnowledge.objectives.length} required objectives (${s.planProgress}%). ` +
    (elapsed
      ? `Time elapsed: ${Math.min(90, elapsed)}/90 days (${Math.round((Math.min(90, elapsed) / 90) * 100)}%).`
      : "Choose a start date to track time elapsed.");
  byId("planObjectives").innerHTML = [1, 2, 3]
    .map(
      (phase) =>
        `<article class="card"><h3>Days ${phase === 1 ? "1–30 · Foundation" : phase === 2 ? "31–60 · Develop" : "61–90 · Convert"}</h3>${salesKnowledge.objectives
          .filter((o) => o.phase === phase)
          .map(
            (o) =>
              `<label class="objective"><input type="checkbox" data-objective="${o.id}" ${s.planObjectives[o.id] ? "checked" : ""}><span><b>${o.title}</b><small>${o.detail}</small></span></label>`,
          )
          .join("")}</article>`,
    )
    .join("");
  byId("planObjectives")
    .querySelectorAll("[data-objective]")
    .forEach(
      (el) =>
        (el.onchange = () => {
          s.planObjectives[el.dataset.objective] = el.checked;
          save();
        }),
    );
}
byId("planStartDate").onchange = (e) => {
  if (e.target.value && e.target.value > todaySG()) {
    showToast("Choose today or an earlier start date.");
    e.target.value = s.planStartDate;
    return;
  }
  s.planStartDate = e.target.value;
  save();
};
function renderHomeCoaching() {
  const overdue = s.opps.filter(
    (o) =>
      o.dueDate && o.dueDate < todaySG() && !["Won", "Lost"].includes(o.stage),
  );
  const next = salesKnowledge.objectives.find((o) => !s.planObjectives[o.id]);
  byId("homeCoachText").textContent = overdue.length
    ? `${overdue.length} overdue next action${overdue.length > 1 ? "s" : ""}. Review the owner, blocker and new commitment in Pipeline.`
    : next
      ? next.title + " — " + next.detail
      : "All required plan objectives complete. Review your pipeline and set the next development goal.";
  byId("homeActivity").innerHTML =
    `<span class="pill">${s.planProgress}% plan completion</span><span class="pill">${s.dailyQuests.length}/3 today’s objectives</span><span class="pill">${overdue.length} overdue next actions</span>`;
}
document.querySelectorAll("[data-quest]").forEach((el) => {
  el.checked = s.dailyQuests.includes(el.dataset.quest);
  el.onchange = () => {
    s.dailyQuests = [...document.querySelectorAll("[data-quest]:checked")].map(
      (el) => el.dataset.quest,
    );
    save();
  };
});
addOpp = function () {
  const name = oppName.value.trim(),
    company = byId("oppCompany").value.trim(),
    value = Number(oppValue.value);
  if (!name || !company || !Number.isFinite(value) || value <= 0)
    return showToast("Enter a project, company and positive estimated value.");
  const note = byId("oppUpdate").value.trim(),
    date = byId("oppUpdateDate").value || todaySG();
  s.opps.push({
    id: crypto.randomUUID(),
    name,
    company,
    value,
    stage: oppStage.value,
    contact: byId("oppContact").value.trim(),
    nextAction: byId("oppNextAction").value.trim(),
    dueDate: byId("oppDueDate").value,
    lastUpdated: todaySG(),
    attention: "",
    updates: note ? [{ id: crypto.randomUUID(), date, text: note }] : [],
  });
  [
    "oppName",
    "oppValue",
    "oppCompany",
    "oppContact",
    "oppUpdate",
    "oppNextAction",
    "oppDueDate",
  ].forEach((id) => (byId(id).value = ""));
  save();
  byId("addOpportunityDialog").close();
  showToast("Opportunity added");
};
byId("oppUpdateDate").value = todaySG();
byId("openAddOpportunity").onclick = () => { byId("oppUpdateDate").value = todaySG(); byId("addOpportunityDialog").showModal(); };
function opportunityFlags(o) {
  if (["Won", "Lost"].includes(o.stage)) return [];
  const flags = [];
  if (o.attention) flags.push(o.attention);
  if (o.dueDate && o.dueDate < todaySG()) flags.push("Next action overdue");
  if (!o.nextAction) flags.push("Next action missing");
  if (!o.lastUpdated || o.lastUpdated < new Date(Date.parse(todaySG()) - 14 * 86400000).toISOString().slice(0,10)) flags.push("No update in 14 days");
  return flags;
}
function renderPipelineRecords() {
  const active = s.opps.filter(o => !["Won", "Lost"].includes(o.stage));
  byId("activeOpportunityCount").textContent = active.length;
  byId("attentionOpportunityCount").textContent = active.filter(o => opportunityFlags(o).length).length;
  const c = byId("opportunityManager");
  const rows = [...s.opps].sort((a,b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""));
  c.innerHTML = rows.length ? `<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Opportunity / company</th><th>Stage</th><th>Est. value</th><th>Latest activity / attention</th><th>Next action</th><th>Last updated</th><th><span class="muted">Remove</span></th></tr></thead><tbody>${rows.map(o => {
    const latest = [...o.updates].sort((a,b) => b.date.localeCompare(a.date))[0];
    const flags = opportunityFlags(o);
    return `<tr><td><button class="crm-opportunity" data-edit-opportunity="${o.id}">${escapeHTML(o.name)}</button><small>${escapeHTML(o.company || "Company not recorded")}</small></td><td><span class="crm-stage">${escapeHTML(o.stage)}</span></td><td class="crm-nowrap">${money(o.value)}</td><td><div class="crm-note">${escapeHTML(latest?.text || "No activity recorded")}</div>${flags.length ? `<small class="crm-attention">${escapeHTML(flags.join(" · "))}</small>` : ""}</td><td>${escapeHTML(o.nextAction || "—")}<small>${o.dueDate ? "Due " + escapeHTML(o.dueDate) : ""}</small></td><td class="crm-nowrap">${escapeHTML(o.lastUpdated || "Not recorded")}</td><td><button class="delete-record" data-delete-opp="${o.id}" aria-label="Remove ${escapeHTML(o.name)}">×</button></td></tr>`;
  }).join("")}</tbody></table></div>` : '<p class="empty-state">No opportunities yet. Add a project to start your CRM.</p>';
  bindOpportunityRows(c);
  c.querySelectorAll("[data-edit-opportunity]").forEach(el => el.onclick = () => editOpportunity(el.dataset.editOpportunity));
}
function editOpportunity(id) {
  const o = s.opps.find((o) => o.id === id);
  if (!o) return;
  byId("opportunityTitle").textContent = o.name;
  const form = byId("opportunityEditForm");
  form.innerHTML = `<div class="form-columns"><label>Project<input name="project" value="${escapeHTML(o.name)}" required maxlength="200"></label><label>Company<input name="company" value="${escapeHTML(o.company)}" required maxlength="200"></label></div><label>Contact / role<input name="contact" value="${escapeHTML(o.contact)}"></label><div class="form-columns"><label>Value (SGD)<input name="value" type="number" min="1" value="${o.value}" required></label><label>Stage<select name="stage">${stages.map((stage) => `<option ${stage === o.stage ? "selected" : ""}>${stage}</option>`).join("")}</select></label></div><h3>Update history</h3><div class="update-history">${o.updates.map((u) => `<label>${escapeHTML(u.date)}<textarea data-update-text="${u.id}" maxlength="4000">${escapeHTML(u.text)}</textarea><input data-update-date="${u.id}" type="date" value="${escapeHTML(u.date)}" required></label>`).join("") || '<p class="muted">No updates recorded.</p>'}</div><label>What needs attention?<textarea name="attention" maxlength="1000" placeholder="Blocker, concern or help needed">${escapeHTML(o.attention || "")}</textarea></label><label>What happened? Add an activity update<textarea name="newUpdate" placeholder="Movement, discussion or outcome" maxlength="4000"></textarea></label><label>Update date<input name="updateDate" type="date" value="${todaySG()}" required></label><label>Next action<input name="nextAction" value="${escapeHTML(o.nextAction)}" maxlength="400"></label><label>Next action due<input name="dueDate" type="date" value="${escapeHTML(o.dueDate)}"></label><button class="primary wide">Save opportunity</button>`;
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = new FormData(form),
      v = Number(data.get("value"));
    if (!Number.isFinite(v) || v <= 0) return;
    Object.assign(o, {
      name: data.get("project").trim(),
      company: data.get("company").trim(),
      contact: data.get("contact").trim(),
      value: v,
      stage: data.get("stage"),
      nextAction: data.get("nextAction").trim(),
      dueDate: data.get("dueDate"),
      attention: data.get("attention").trim(),
    });
    o.updates.forEach((u) => {
      u.text = form.querySelector(`[data-update-text="${u.id}"]`).value.trim();
      u.date = form.querySelector(`[data-update-date="${u.id}"]`).value;
    });
    const note = data.get("newUpdate").trim();
    if (note)
      o.updates.push({
        id: crypto.randomUUID(),
        date: data.get("updateDate"),
        text: note,
      });
    o.lastUpdated = todaySG();
    byId("opportunityDialog").close();
    save();
    showToast("Opportunity and update history saved");
  };
  byId("opportunityDialog").showModal();
}
byId("generateMeetingReport").onclick = async () => {
  const button = byId("generateMeetingReport"), panel = byId("meetingReport");
  if (!s.opps.length) { panel.textContent = "Add an opportunity before generating your report."; return; }
  const days = Number(byId("reportWindow").value), endDate = todaySG();
  const startDate = new Date(Date.parse(endDate) - (days - 1) * 86400000).toISOString().slice(0,10);
  button.disabled = true;
  panel.textContent = "Reviewing recent activity, blockers and next actions…";
  try {
    const {result} = await callAI({operation:"pipeline_report", days, endDate, opportunities: s.opps});
    panel.innerHTML = `<h3>Meeting script · ${escapeHTML(startDate)} to ${escapeHTML(endDate)}</h3><p class="mini muted">AI draft based on a snapshot of saved records. Re-generate after editing your pipeline.</p><h4>Priority concerns</h4>${plainList(result.concerns)}<textarea id="reportText" readonly aria-label="15-minute meeting script"></textarea><h4>Review before the meeting</h4>${plainList(result.reviewQuestions)}<button id="copyReport" class="primary">Copy script and review checklist</button>`;
    byId("reportText").value = result.script;
    byId("copyReport").onclick = () => copyText(result.script + "\n\nREVIEW BEFORE MEETING\n" + result.reviewQuestions.map(q => "• " + q).join("\n"));
  } catch(error) { panel.textContent = error.message; }
  finally { button.disabled = false; }
};
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied");
  } catch {
    showToast("Copy is unavailable here. Select the text and copy manually.");
  }
}
const keywordGroups = salesKnowledge.categories;
byId("keywordGroups").innerHTML = keywordGroups
  .map((c) => `<button data-keyword-category="${c.id}">${c.title}</button>`)
  .join("");
byId("keywordGroups")
  .querySelectorAll("button")
  .forEach(
    (btn) =>
      (btn.onclick = () => {
        byId("bciKeywords").value = keywordGroups.find(
          (c) => c.id === btn.dataset.keywordCategory,
        ).keywords;
        byId("keywordGroups")
          .querySelectorAll("button")
          .forEach((b) => b.classList.toggle("on", b === btn));
        buildBCIRecipe();
      }),
  );
byId("bciKeywords").value = keywordGroups[1].keywords;
function buildBCIRecipe() {
  const keywords = byId("bciKeywords").value.trim();
  if (!keywords) {
    byId("bciMessage").textContent =
      "Add at least one relevant package keyword before building the recipe.";
    byId("recipe").textContent = "Keywords are required.";
    return;
  }
  byId("bciMessage").textContent =
    "Recipe prepared. Apply these filters in your BCI account.";
  byId("recipe").textContent =
    `PROJECT SEARCH · PACKAGE-FOCUSED\n\nProject location: Singapore\nSector: ${byId("bciSector").value}\nStage: ${byId("bciStage").value}\nLast updated: within ${byId("bciUpdated").value} days\nMain contractor appointed: ${byId("bciAppointed").checked ? "YES" : "Not restricted"}\n\nREQUIRED KEYWORDS\n${keywords}\n\nEnter the terms in BCI’s Keyword(s) control. Use the supported match mode; if OR/multiple terms are unavailable, run separate searches for the phrases.\n\nReview package scope, timing, buyer and Lucas ownership. Project descriptions can omit package wording, so a keyword match still needs qualification.`;
  s.bciRecipe = {
    keywords,
    sector: byId("bciSector").value,
    stage: byId("bciStage").value,
    updated: byId("bciUpdated").value,
    appointed: byId("bciAppointed").checked,
  };
}
byId("buildBCI").onclick = () => {
  buildBCIRecipe();
  save();
};
byId("copyBCI").onclick = () => copyText(byId("recipe").textContent);
if (s.bciRecipe) {
  byId("bciKeywords").value = s.bciRecipe.keywords;
  byId("bciSector").value = s.bciRecipe.sector;
  byId("bciStage").value = s.bciRecipe.stage;
  byId("bciUpdated").value = s.bciRecipe.updated;
  byId("bciAppointed").checked = s.bciRecipe.appointed;
}
buildBCIRecipe();
function setupCategoryTabs(id, callback) {
  const el = byId(id);
  el.innerHTML = salesKnowledge.categories
    .map((c) => `<button data-category="${c.id}">${c.title}</button>`)
    .join("");
  el.querySelectorAll("button").forEach(
    (btn) =>
      (btn.onclick = () => {
        el.querySelectorAll("button").forEach((b) =>
          b.classList.toggle("on", b === btn),
        );
        callback(
          salesKnowledge.categories.find((c) => c.id === btn.dataset.category),
        );
      }),
  );
  el.querySelector("button").click();
}
setupCategoryTabs("academyTabs", (c) => {
  byId("academyContent").innerHTML =
    `<div class="grid two"><article class="card"><h2>${c.title}</h2><p>${c.problem}</p><h3>Applications</h3>${plainList(c.applications)}<h3>Who to speak to</h3><p>${c.buyers}</p><h3>Discovery questions</h3>${plainList(c.questions)}</article><article class="card"><h3>Brands in your catalogue</h3>${c.brands.map(([name, origin, url]) => `<div class="brand-profile"><b>${name}</b><span>${origin}</span>${url ? `<a href="${url}" target="_blank" rel="noopener">Official brand site ↗</a>` : "<small>Source: catalogue pp. 6–7</small>"}</div>`).join("")}${c.brandNotes ? plainList(c.brandNotes) : ""}<h3>Catalogue ranges & application fit</h3>${(c.ranges || []).map(([title, models, use]) => `<div class="catalogue-range"><b>${escapeHTML(title)}</b><p class="mini catalogue-source">${escapeHTML(models)}</p><p>${escapeHTML(use)}</p></div>`).join("")}<h3>Catalogue evidence</h3><p>${escapeHTML(c.catalogueEvidence || "")}</p><h3>What to check before recommending</h3>${plainList(c.selection)}<div class="notice mini">${c.evidence}</div><p class="mini muted">Source: Faishak Catalogue 2026–2027, pp. ${escapeHTML(c.cataloguePages || "6–7")}. Brand-country background is labelled where not stated in the catalogue.</p></article></div>`;
});
let currentCompetitorCategory = "sealing";
setupCategoryTabs("competitorTabs", (c) => {
  currentCompetitorCategory = c.id;
  byId("battlecards").innerHTML =
    `<div class="grid two"><article class="card"><h2>${c.title}</h2><p><b>Faishak portfolio:</b> ${c.brands.map((b) => b[0]).join(" · ")}</p><h3>Potential category competitors</h3>${plainList(c.candidates)}<p class="mini muted">Research candidates, not confirmed substitutes or an exhaustive market list.</p><h3>Potential differentiation to prove</h3>${plainList(["Match the exact application and required supporting evidence.", "Confirm a useful technical review, compatible interfaces and installation requirements.", "Document actual local supply, commissioning or support arrangements before claiming an advantage."])}</article><article class="card"><h3>Comparison checklist</h3>${plainList(c.selection)}<h3>Ask before challenging the incumbent</h3>${plainList(c.questions)}<div class="notice mini">${c.evidence} An incumbent may remain the better fit; compare documented requirements rather than attack the brand.</div></article></div>`;
  renderCompetitorLibrary();
});
byId("mrtNotes").value = s.mrtNotes;
byId("saveMrtNotes").onclick = () => {
  s.mrtNotes = byId("mrtNotes").value;
  save();
  showToast("Project insight saved");
};
function renderCompetitorLibrary() {
  byId("competitorLibrary").innerHTML =
    s.competitors
      .filter((c) => c.category === currentCompetitorCategory)
      .map(
        (c) =>
          `<article class="card"><div class="panel-title"><h3>${escapeHTML(c.brand)}</h3><span class="pill">Reviewed · ${escapeHTML(c.confidence || "confidence not assessed")}</span></div><p>${escapeHTML(c.summary)}</p><div class="grid two"><div><h4>Source-supported strengths</h4>${plainList(c.strengths)}</div><div><h4>Limitations / evidence gaps</h4>${plainList(c.limitations)}</div></div><h4>Conditional differentiation to verify</h4>${plainList(c.differentiators)}<p class="mini">${sourceLinks(c.sources)}</p><small>Reviewed ${escapeHTML(c.reviewedAt)}</small></article>`,
      )
      .join("") ||
    '<p class="muted">No reviewed competitor analysis in this application yet. Add a brand, source URL or PDF to begin.</p>';
}
byId("competitorCategory").innerHTML = salesKnowledge.categories
  .map((c) => `<option value="${c.id}">${c.title}</option>`)
  .join("");
let competitorProposal = null;
byId("newCompetitor").onclick = () => byId("competitorDialog").showModal();
byId("competitorForm").onsubmit = async (e) => {
  e.preventDefault();
  const requestEpoch = accountEpoch;
  byId("analyseCompetitor").disabled = true;
  byId("competitorStatus").textContent =
    "Reading sources and preparing a comparison…";
  try {
    const file = byId("competitorPDF").files[0];
    if (
      file &&
      (file.type !== "application/pdf" || file.size > 2 * 1024 * 1024)
    )
      throw Error("Use a PDF smaller than 2 MB.");
    const pdf = file
      ? await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(file);
        })
      : null;
    const data = await callAI({
      operation: "competitor",
      name: byId("competitorName").value,
      url: byId("competitorURL").value,
      evidence: byId("competitorEvidence").value,
      category: byId("competitorCategory").value,
      pdf,
      portfolio: salesKnowledge.categories,
    });
    if (requestEpoch !== accountEpoch) return;
    competitorProposal = data.result;
    if (
      !salesKnowledge.categories.some(
        (c) => c.id === competitorProposal.category,
      )
    )
      competitorProposal.category = byId("competitorCategory").value;
    byId("competitorProposal").innerHTML =
      `<h3>Review: ${escapeHTML(competitorProposal.brand)}</h3><p>${escapeHTML(competitorProposal.summary)}</p><b>Suggested application: ${escapeHTML(competitorProposal.category)}</b><h4>Strengths</h4>${plainList(competitorProposal.strengths)}<h4>Limitations / unknowns</h4>${plainList(competitorProposal.limitations)}<h4>Comparison questions</h4>${plainList(competitorProposal.questions)}<p class="mini">${sourceLinks(competitorProposal.sources)}</p><button id="acceptCompetitor" class="primary">Reviewed — add to library</button>`;
    byId("acceptCompetitor").onclick = () => {
      s.competitors.push({
        ...competitorProposal,
        id: crypto.randomUUID(),
        reviewedAt: todaySG(),
      });
      save();
      renderCompetitorLibrary();
      byId("competitorDialog").close();
      showToast("Reviewed comparison saved");
    };
    byId("competitorStatus").textContent =
      "Check source support and the suggested application before saving.";
  } catch (error) {
    byId("competitorStatus").textContent = error.message;
  } finally {
    byId("analyseCompetitor").disabled = false;
  }
};
let activeSequence = salesKnowledge.sequences[0],
  activeStep = 0;
function renderSequence() {
  byId("sequenceIntro").innerHTML =
    `<h3>${activeSequence.title}</h3><p>${activeSequence.strategy}</p><p class="mini muted">Inspired by useful-content, clear-offer and consultative discovery principles. A response replaces the schedule with an agreed next step.</p>`;
  byId("sequenceDiagram").innerHTML = activeSequence.steps
    .map(
      (step, i) =>
        `<button data-step="${i}" class="sequence-node ${i === activeStep ? "selected" : ""}"><span>${step.day}</span><b>${step.channel}</b><small>${step.goal}</small></button>${i < activeSequence.steps.length - 1 ? '<span class="sequence-arrow" aria-hidden="true">→</span>' : ""}`,
    )
    .join("");
  byId("sequenceDiagram")
    .querySelectorAll("[data-step]")
    .forEach(
      (btn) =>
        (btn.onclick = () => {
          activeStep = Number(btn.dataset.step);
          renderSequence();
        }),
    );
  const step = activeSequence.steps[activeStep],
    message = step.message
      .replaceAll("{project}", byId("sequenceProject").value || "your project")
      .replaceAll(
        "{package}",
        byId("sequencePackage").value || "the relevant package",
      );
  byId("sequenceStep").innerHTML =
    `<h3>${step.day} · ${step.channel}</h3><p>${step.goal}</p><blockquote>${escapeHTML(message)}</blockquote><div class="notice mini"><b>Response branch:</b> ${step.branch}</div><button id="copySequence" class="primary">Copy this message</button>`;
  byId("copySequence").onclick = () => copyText(message);
}
byId("sequenceTabs").innerHTML = salesKnowledge.sequences
  .map((seq) => `<button data-sequence="${seq.id}">${seq.title}</button>`)
  .join("");
byId("sequenceTabs")
  .querySelectorAll("button")
  .forEach(
    (btn) =>
      (btn.onclick = () => {
        activeSequence = salesKnowledge.sequences.find(
          (seq) => seq.id === btn.dataset.sequence,
        );
        activeStep = 0;
        byId("sequenceTabs")
          .querySelectorAll("button")
          .forEach((b) => b.classList.toggle("on", b === btn));
        renderSequence();
      }),
  );
byId("sequenceProject").oninput = renderSequence;
byId("sequencePackage").oninput = renderSequence;
renderSequence();
byId("techniqueCards").innerHTML = salesKnowledge.techniques
  .map(
    (t) =>
      `<details class="technique-card"><summary>${t.name}<small>${t.expert}</small></summary><p>${t.method}</p><blockquote>${t.example}</blockquote><p class="mini"><b>Avoid:</b> ${t.avoid}</p></details>`,
  )
  .join("");
let practiceBusy = false,
  practiceEpoch = 0;
function renderConversation() {
  byId("conversation").innerHTML = s.practice.history
    .map(
      (m) =>
        `<div class="message ${m.role}"><b>${m.role === "customer" ? "Customer" : "You"}</b><p>${escapeHTML(m.text)}</p></div>`,
    )
    .join("");
  byId("interestMeter").value = s.practice.interest;
  byId("interestScore").textContent = s.practice.interest + " / 100";
  byId("sendPractice").disabled =
    practiceBusy || s.practice.closed || !s.practice.history.length;
  byId("practiceReply").disabled = practiceBusy || s.practice.closed;
  byId("conversation").scrollTop = byId("conversation").scrollHeight;
}
byId("startAIPractice").onclick = async () => {
  if (practiceBusy) return;
  practiceBusy = true;
  const epoch = ++practiceEpoch;
  byId("startAIPractice").disabled = true;
  byId("practiceStatus").textContent = "Starting your AI customer…";
  try {
    const persona = byId("practicePersona").value,
      difficulty = byId("practiceDifficulty").value;
    const response = await callAI({
      operation: "practice",
      persona,
      difficulty,
      interest: 30,
      history: [],
    });
    if (epoch !== practiceEpoch) return;
    s.practice = {
      history: [{ role: "customer", text: response.result.customerReply }],
      interest: 30,
      closed: false,
      persona,
      difficulty,
    };
    byId("practiceFeedback").innerHTML = "";
    byId("practiceStatus").textContent =
      "Live AI conversation · Respond to the customer’s actual concern.";
    save();
  } catch (error) {
    byId("practiceStatus").textContent = error.message;
  } finally {
    if (epoch === practiceEpoch) {
      practiceBusy = false;
      byId("startAIPractice").disabled = false;
      renderConversation();
    }
  }
};
byId("practiceForm").onsubmit = async (e) => {
  e.preventDefault();
  if (practiceBusy || s.practice.closed || !s.practice.history.length) return;
  const text = byId("practiceReply").value.trim();
  if (!text) return;
  practiceBusy = true;
  const epoch = practiceEpoch;
  const history = [...s.practice.history, { role: "seller", text }];
  byId("practiceStatus").textContent = "Customer is considering your response…";
  renderConversation();
  try {
    const response = await callAI({
      operation: "practice",
      persona: s.practice.persona,
      difficulty: s.practice.difficulty,
      interest: s.practice.interest,
      history,
    });
    if (epoch !== practiceEpoch) return;
    const r = response.result;
    s.practice.history = [
      ...history,
      { role: "customer", text: r.customerReply },
    ];
    s.practice.interest = Math.max(
      0,
      Math.min(100, s.practice.interest + r.delta),
    );
    s.practice.closed = r.outcome !== "continue";
    byId("practiceReply").value = "";
    byId("practiceFeedback").innerHTML =
      `<div class="coaching-feedback"><b>${r.delta > 0 ? "+" : ""}${r.delta} interest · ${escapeHTML(r.technique || "Conversation coaching")}</b><p>${escapeHTML(r.feedback)}</p><p><b>Alternative to consider:</b> ${escapeHTML(r.betterExample || "")}</p></div>`;
    byId("practiceStatus").textContent = s.practice.closed
      ? r.outcome === "next_step"
        ? "Conversation complete: an agreed next step."
        : "Customer has closed the conversation. Review the coaching before restarting."
      : "Conversation continues. Respond to the latest customer message.";
    save();
  } catch (error) {
    byId("practiceStatus").textContent =
      error.message + " Your unsent response is retained.";
  } finally {
    if (epoch === practiceEpoch) {
      practiceBusy = false;
      renderConversation();
    }
  }
};
const newsTopics = {
  projects: "Project awards",
  transport: "MRT & transport",
  healthcare: "Healthcare",
  doors: "Door technologies",
  sustainability: "Sustainability",
};
let activeNewsTopic = "projects",
  newsRequest = 0;
byId("newsTopics").innerHTML = Object.entries(newsTopics)
  .map(([id, title]) => `<button data-news-topic="${id}">${title}</button>`)
  .join("");
byId("newsTopics")
  .querySelectorAll("button")
  .forEach(
    (btn) =>
      (btn.onclick = () => {
        activeNewsTopic = btn.dataset.newsTopic;
        byId("newsTopics")
          .querySelectorAll("button")
          .forEach((b) => b.classList.toggle("on", b === btn));
        loadNews();
      }),
  );
async function loadNews(force = false) {
  const request = ++newsRequest,
    topic = activeNewsTopic;
  byId("newsStatus").textContent = "Loading industry headlines…";
  byId("refreshNews").disabled = true;
  try {
    const r = await fetch(
      "/.netlify/functions/news?topic=" + topic + (force ? "&refresh=1" : ""),
    );
    const data = await r.json();
    if (!r.ok) throw Error(data.error || "News refresh failed.");
    if (request !== newsRequest) return;
    byId("newsCards").innerHTML =
      data.items
        .map(
          (n) =>
            `<a class="news-card" href="${escapeHTML(externalURL(n.url) || "#")}" target="_blank" rel="noopener noreferrer"><span class="eyebrow">${escapeHTML(n.publisher)}</span><h3>${escapeHTML(n.title)}</h3><small>${n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("en-SG", { timeZone: "Asia/Singapore" }) : "Publication date unavailable"}</small><span>Read source ↗</span></a>`,
        )
        .join("") ||
      '<p class="empty-state">No recent headlines matched this topic.</p>';
    byId("newsStatus").textContent =
      (data.stale ? "Cached headlines · " : "Updated ") +
      new Date(data.updatedAt).toLocaleString("en-SG", {
        timeZone: "Asia/Singapore",
      }) +
      (data.message ? " · " + data.message : "");
  } catch (error) {
    if (request !== newsRequest) return;
    byId("newsStatus").textContent =
      "Live feed unavailable. " +
      (error.message.includes("JSON")
        ? "Deploy with the included server functions to enable RSS."
        : error.message);
    byId("newsCards").innerHTML =
      '<a class="news-card" href="https://news.google.com/search?q=Singapore%20construction%20project%20awards&hl=en-SG&gl=SG&ceid=SG%3Aen" target="_blank" rel="noopener"><h3>Open Google News</h3><p>Read source headlines while the RSS connection is being configured.</p><span>View industry news ↗</span></a>';
  } finally {
    if (request === newsRequest) byId("refreshNews").disabled = false;
  }
}
byId("refreshNews").onclick = () => loadNews(true);
byId("newsPrevious").onclick = () =>
  byId("newsCards").scrollBy({
    left: -320,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
byId("newsNext").onclick = () =>
  byId("newsCards").scrollBy({
    left: 320,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
setInterval(
  () => {
    if (document.visibilityState === "visible") loadNews();
  },
  15 * 60 * 1000,
);
function renderEvents() {
  byId("eventList").innerHTML =
    s.events
      .map(
        (event) =>
          `<article class="card event-card"><span class="pill">${escapeHTML(event.date)}</span><span class="pill">${event.date < todaySG() ? "Past event" : "Upcoming"}</span><h3>${escapeHTML(event.name)}</h3><p>${escapeHTML(event.venue)} · ${escapeHTML(event.cost)}</p><p>${escapeHTML(event.relevance)}</p><small>${escapeHTML(event.verification || "Source needs verification")}</small><p>${sourceLinks([{ url: event.url, title: "Organiser / event source" }])}</p></article>`,
      )
      .join("") ||
    '<p class="empty-state">No source-linked 2026 events loaded yet. Use AI refresh once the connection is configured.</p>';
  byId("eventsStatus").textContent = s.eventsRefreshedAt
    ? "Last refresh: " +
      new Date(s.eventsRefreshedAt).toLocaleString("en-SG", {
        timeZone: "Asia/Singapore",
      })
    : "Not refreshed yet.";
  const upcoming = s.events
    .filter((e) => e.date >= todaySG())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const home = document.querySelector(".dashboard-secondary>.panel");
  home
    .querySelectorAll(".dashboard-event,.events-empty")
    .forEach((e) => e.remove());
  const last = home.querySelector(".wide");
  if (upcoming.length) {
    upcoming.forEach((e) => {
      const btn = document.createElement("button");
      btn.className = "dashboard-event";
      btn.innerHTML = `<span class="date"><small>${new Date(e.date + "T00:00:00Z").toLocaleDateString("en-SG", { month: "short", timeZone: "UTC" }).toUpperCase()}</small><b>${e.date.slice(-2)}</b></span><div><b>${escapeHTML(e.name)}</b><p><small>${escapeHTML(e.venue)}</small></p></div>`;
      btn.onclick = () => navigate("events");
      home.insertBefore(btn, last);
    });
  } else {
    const empty = document.createElement("p");
    empty.className = "events-empty muted mini";
    empty.textContent =
      "Refresh Events Radar to load source-linked 2026 events. Original sample dates were removed.";
    home.insertBefore(empty, last);
  }
}
byId("refreshEvents").onclick = async () => {
  byId("refreshEvents").disabled = true;
  byId("eventsStatus").textContent =
    "Searching organiser sources for 2026 events…";
  try {
    const requestEpoch = accountEpoch;
    const data = await callAI({ operation: "events" });
    if (requestEpoch !== accountEpoch) return;
    s.events = data.result.events;
    s.eventsRefreshedAt = data.generatedAt;
    save();
    renderEvents();
    byId("eventsStatus").textContent +=
      " · " +
      (data.result.notes || "Check registration details with the organiser.");
  } catch (error) {
    byId("eventsStatus").textContent =
      error.message + " Existing results are retained.";
  } finally {
    byId("refreshEvents").disabled = false;
  }
};
["Name", "Company", "Application", "Timing", "Stakeholders"].forEach(
  (key) => (byId("brief" + key).value = s.brief[key.toLowerCase()] || ""),
);
byId("projectNotes").value = s.brief.notes || byId("projectNotes").value;
function saveBrief() {
  s.brief = {};
  ["Name", "Company", "Application", "Timing", "Stakeholders"].forEach(
    (key) => (s.brief[key.toLowerCase()] = byId("brief" + key).value),
  );
  s.brief.notes = byId("projectNotes").value;
  save();
  showToast("Project brief saved");
}
byId("saveBrief").onclick = saveBrief;
byId("briefToPipeline").onclick = () => {
  saveBrief();
  oppName.value = s.brief.name;
  byId("oppCompany").value = s.brief.company;
  byId("oppNextAction").value = s.brief.notes;
  byId("oppUpdate").value = [
    s.brief.application,
    s.brief.timing,
    s.brief.stakeholders,
  ]
    .filter(Boolean)
    .join("\n");
  navigate("pipeline");
};
document
  .querySelectorAll("[data-close-dialog]")
  .forEach(
    (btn) => (btn.onclick = () => byId(btn.dataset.closeDialog).close()),
  );

function setSyncStatus(text) {
  byId("syncStatus").textContent = text;
}
function setAccountMessage(message){cloud.accountMessage=message;byId("accountStatus").textContent=message;}
function renderAccount() {
  const configured = Boolean(
    cloud.config?.supabaseUrl && cloud.config?.supabaseKey,
  );
  byId("accountForm").hidden = Boolean(cloud.session) || !configured;
  byId("signedInControls").hidden = !cloud.session;
  byId("accountIdentity").textContent = cloud.session?.user?.email || "";
  byId("connectionDetails").textContent =
    `Cloud storage: ${configured ? "configured" : "not configured"}. AI: ${cloud.config?.aiConfigured ? "configured" : "not configured"}. ` +
    (!configured
      ? "Set Supabase public configuration in hosting settings."
      : "AI access requires this login.");
  setAccountMessage(cloud.accountMessage || (cloud.session
    ? "Signed in. " +
      (cloud.ready
        ? "Workspace syncing is enabled."
        : "Load your cloud workspace or import local records.")
    : "Local records work without a login. Sign in to sync between your Mac and Windows laptop."));
  byId("importLocal").disabled=cloud.revision!==null;
}
async function getAccessToken() {
  if (!cloud.session)
    throw Error("Sign in through the cloud button to use AI and syncing.");
  if (
    cloud.session.expires_at &&
    cloud.session.expires_at * 1000 < Date.now() + 30000
  ) {
    const response = await fetch(
      cloud.config.supabaseUrl + "/auth/v1/token?grant_type=refresh_token",
      {
        method: "POST",
        headers: {
          apikey: cloud.config.supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: cloud.session.refresh_token }),
      },
    );
    const data = await response.json();
    if (!response.ok) throw Error("Your login has expired. Sign in again.");
    cloud.session = {
      ...data,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    };
    sessionStorage.setItem("fsq-session", JSON.stringify(cloud.session));
  }
  return cloud.session.access_token;
}
async function callAI(body) {
  if (!cloud.config?.aiConfigured)
    throw Error(
      "AI is not connected yet. Configure FAISHAK_AI_KEY securely in hosting settings; no key belongs in this page.",
    );
  const token = await getAccessToken();
  const response = await fetch("/.netlify/functions/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(body),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error(
      "AI server functions are unavailable. Deploy the included Netlify functions.",
    );
  }
  if (!response.ok) throw Error(data.error || "AI request failed.");
  return data;
}
async function cloudRequest(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(cloud.config.supabaseUrl + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: cloud.config.supabaseKey,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = [];
  }
  if (!response.ok)
    throw Error(
      data.message ||
        "Cloud storage request failed. Check the database schema and row-level security.",
    );
  return data;
}
function applyCloudState(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.opps))
    throw Error(
      "The cloud workspace has an invalid format. Local records have been retained.",
    );
  accountEpoch++;
  practiceEpoch++;
  practiceBusy = false;
  byId("startAIPractice").disabled = false;
  byId("practiceReply").value = "";
  cloud.ready = false;
  s = {
    ...structuredClone(defaults),
    ...state,
    skills: { ...defaults.skills, ...state.skills },
  };
  normalizeWorkspace();
  localStorage.setItem("fsq", JSON.stringify(s));
  render();
  renderConversation();
  renderEvents();
  renderCompetitorLibrary();
  byId("practiceFeedback").innerHTML = "";
  byId("mrtNotes").value = s.mrtNotes;
  document
    .querySelectorAll("[data-quest]")
    .forEach((el) => (el.checked = s.dailyQuests.includes(el.dataset.quest)));
  ["Name", "Company", "Application", "Timing", "Stakeholders"].forEach(
    (key) => (byId("brief" + key).value = s.brief[key.toLowerCase()] || ""),
  );
  byId("projectNotes").value = s.brief.notes || "";
  cloud.ready = true;
}
async function loadCloud() {
  if (cloud.saving) throw Error("Wait for the current save to finish.");
  clearTimeout(cloud.timer);
  cloud.ready = false;
  setSyncStatus("Loading cloud…");
  setAccountMessage("Loading your saved cloud workspace…");
  const rows = await cloudRequest(
    "sales_workspaces?select=state,revision&user_id=eq." +
      encodeURIComponent(cloud.session.user.id),
  );
  if (rows.length) {
    const localSnapshot = JSON.stringify(s);
    localStorage.setItem("fsq-local-before-cloud", localSnapshot);
    cloud.revision = rows[0].revision;
    cloud.conflict = false;
    applyCloudState(rows[0].state);
    setSyncStatus("Cloud synced");
    setAccountMessage("Latest cloud workspace loaded. Local records were backed up on this browser.");
  } else {
    cloud.revision = null;
    setSyncStatus("Cloud: no workspace");
    setAccountMessage("No cloud workspace yet. Import this local workspace to start syncing.");
  }
  renderAccount();
}
function scheduleCloudSave() {
  if (!cloud.ready || !cloud.session || cloud.conflict) return;
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(
    () =>
      syncCloud().catch((error) => {
        setSyncStatus("Sync needs attention");
        setAccountMessage(error.message);
      }),
    700,
  );
}
async function syncCloud() {
  if (!cloud.ready || cloud.conflict || !cloud.session) return;
  if (cloud.saving) {
    cloud.pending = true;
    return;
  }
  cloud.saving = true;
  const snapshot = structuredClone(s),
    userId = cloud.session.user.id,
    revision = cloud.revision;
  setSyncStatus("Saving cloud…");
  try {
    const nextRevision = Number(revision) + 1;
    const rows = await cloudRequest(
      "sales_workspaces?user_id=eq." +
        encodeURIComponent(userId) +
        "&revision=eq." +
        revision,
      {
        method: "PATCH",
        body: JSON.stringify({
          state: snapshot,
          revision: nextRevision,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    if (!rows.length) {
      cloud.conflict = true;
      throw Error(
        "Another device updated this workspace. Your local changes are retained. Load the latest cloud workspace before editing further.",
      );
    }
    cloud.revision = rows[0].revision;
    setSyncStatus("Cloud synced");
  } finally {
    cloud.saving = false;
    if (cloud.pending && !cloud.conflict) {
      cloud.pending = false;
      scheduleCloudSave();
    }
  }
}
byId("openAccount").onclick = () => {
  renderAccount();
  byId("accountDialog").showModal();
};
async function authenticate(signup = false) {
  if (!cloud.config?.supabaseUrl)
    throw Error("Cloud login is not configured yet.");
  const email = byId("accountEmail").value,
    password = byId("accountPassword").value;
  if (!email || password.length < 8)
    throw Error(
      "Enter your email and a password of at least eight characters.",
    );
  const response = await fetch(
    cloud.config.supabaseUrl +
      "/auth/v1/" +
      (signup ? "signup" : "token?grant_type=password"),
    {
      method: "POST",
      headers: {
        apikey: cloud.config.supabaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw Error(
      data.msg || data.error_description || data.message || "Sign-in failed.",
    );
  byId("accountPassword").value = "";
  if (!data.access_token) {
    setAccountMessage("Account created. Check your email for confirmation, then sign in.");
    return;
  }
  localStorage.setItem("fsq-local-session-backup", JSON.stringify(s));
  cloud.session = {
    ...data,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
  };
  sessionStorage.setItem("fsq-session", JSON.stringify(cloud.session));
  renderAccount();
  await loadCloud();
}
byId("accountForm").onsubmit = async (e) => {
  e.preventDefault();
  try {
    await authenticate();
  } catch (error) {
    setAccountMessage(error.message);
    setSyncStatus("Local workspace");
  }
};
byId("signUp").onclick = async () => {
  try {
    await authenticate(true);
  } catch (error) {
    setAccountMessage(error.message);
  }
};
byId("reloadCloud").onclick = async () => {
  try {
    await loadCloud();
  } catch (error) {
    setAccountMessage(error.message);
  }
};
byId("importLocal").onclick = async () => {
  byId("importLocal").disabled=true;
  setAccountMessage("Saving local records to your cloud workspace…");
  try {
    if (cloud.revision !== null)
      throw Error(
        "A cloud workspace already exists. Load it instead; automatic overwrite is disabled.",
      );
    const state = JSON.parse(
      localStorage.getItem("fsq-local-session-backup") || JSON.stringify(s),
    );
    const rows = await cloudRequest("sales_workspaces", {
      method: "POST",
      body: JSON.stringify({
        user_id: cloud.session.user.id,
        state,
        revision: 1,
      }),
    });
    cloud.revision = rows[0].revision;
    applyCloudState(state);
    setSyncStatus("Cloud synced");
    setAccountMessage("Local records imported. This workspace now syncs between signed-in devices.");
  } catch (error) {
    setAccountMessage(error.message);
  } finally { renderAccount(); }
};
byId("signOut").onclick = async () => {
  if (cloud.saving) return showToast("Wait for the cloud save to finish.");
  if (cloud.ready && !cloud.conflict) {
    try {
      await syncCloud();
    } catch {
      return showToast("Cloud save failed. Resolve sync before signing out.");
    }
  }
  cloud.ready = false;
  clearTimeout(cloud.timer);
  try {
    const token = await getAccessToken();
    await fetch(cloud.config.supabaseUrl + "/auth/v1/logout", {
      method: "POST",
      headers: {
        apikey: cloud.config.supabaseKey,
        Authorization: "Bearer " + token,
      },
    });
  } catch {}
  accountEpoch++;
  practiceEpoch++;
  practiceBusy = false;
  byId("startAIPractice").disabled = false;
  byId("practiceReply").value = "";
  cloud.session = null;
  cloud.revision = null;
  cloud.conflict = false;
  sessionStorage.removeItem("fsq-session");
  const local = localStorage.getItem("fsq-local-session-backup");
  s = local ? JSON.parse(local) : structuredClone(defaults);
  normalizeWorkspace();
  save();
  renderEvents();
  renderConversation();
  renderCompetitorLibrary();
  byId("mrtNotes").value = s.mrtNotes;
  byId("practiceFeedback").innerHTML = "";
  ["Name", "Company", "Application", "Timing", "Stakeholders"].forEach(
    (key) => (byId("brief" + key).value = s.brief[key.toLowerCase()] || ""),
  );
  byId("projectNotes").value = s.brief.notes || "";
  document
    .querySelectorAll("[data-quest]")
    .forEach((el) => (el.checked = s.dailyQuests.includes(el.dataset.quest)));
  setSyncStatus("Local workspace");
  renderAccount();
  setAccountMessage("Signed out. Your original local workspace is restored.");
};
async function initializeConnection() {
  try {
    let configuration;
    try {
      const response = await fetch("/.netlify/functions/config");
      if (!response.ok) throw Error("Config unavailable");
      configuration = await response.json();
    } catch {
      const response = await fetch("/public-config.json");
      if (!response.ok) throw Error("Public configuration unavailable");
      configuration = await response.json();
    }
    cloud.config = configuration;
    if (
      cloud.config.supabaseUrl &&
      !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cloud.config.supabaseUrl)
    )
      throw Error("Use your standard HTTPS Supabase project URL.");
    cloud.config.supabaseUrl = cloud.config.supabaseUrl.replace(/\/$/, "");
    const stored = sessionStorage.getItem("fsq-session");
    if (stored) {
      cloud.session = JSON.parse(stored);
      await loadCloud();
    }
  } catch (error) {
    setAccountMessage("Cloud connection unavailable: " + error.message);
    setSyncStatus("Local workspace");
  }
  renderAccount();
}
render();
renderConversation();
renderEvents();
renderCompetitorLibrary();
localStorage.setItem("fsq", JSON.stringify(s));
initializeConnection();
loadNews();

byId("downloadWorkspace").onclick = () => {
  const blob = new Blob([JSON.stringify(s, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "faishak-workspace-" + todaySG() + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Weekly meetings use dated completed records; undated legacy records can be dated in the editor.
const previousSalesMetrics = salesMetrics;
salesMetrics = function () {
  const metrics = previousSalesMetrics();
  const current = new Date(todaySG() + "T00:00:00Z"),
    start = new Date(current);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const monday = start.toISOString().slice(0, 10);
  metrics.meetings = s.meetings.filter(
    (m) => m.done && m.date && m.date >= monday && m.date <= todaySG(),
  ).length;
  return metrics;
};
const previousOpenMetric = openMetric;
openMetric = function (metric, show = true) {
  previousOpenMetric(metric, show);
  if (metric !== "meetings") return;
  document
    .querySelectorAll("#metricContent [data-record-check]")
    .forEach((checkbox) => {
      const record = s.meetings.find(
          (m) => m.id === checkbox.dataset.recordCheck,
        ),
        input = document.createElement("input");
      input.type = "date";
      input.value = record.date || "";
      input.max = todaySG();
      input.setAttribute("aria-label", "Meeting date for " + record.name);
      input.className = "meeting-date";
      input.onchange = () => {
        record.date = input.value;
        persistSales("Meeting date updated");
      };
      checkbox
        .closest(".record-row")
        .insertBefore(input, checkbox.closest(".record-row").lastElementChild);
    });
};
render();
