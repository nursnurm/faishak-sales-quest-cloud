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
  s.contacts ??= [];
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
  if (byId("contactList")) renderContactList();
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
const keywordGroups = [{id:"broad", title:"Broad: doors", keywords:'door, doors, "door package", ironmongery'}, ...salesKnowledge.categories];
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
byId("bciKeywords").value = keywordGroups[0].keywords;
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
    `PROJECT SEARCH · PACKAGE-FOCUSED\n\nProject location: Singapore\nSector: ${byId("bciSector").value}\nStage: ${byId("bciStage").value}\nLast updated: within ${byId("bciUpdated").value} days\nMain contractor appointed: ${byId("bciAppointed").checked ? "YES" : "Not restricted"}\n\nREQUIRED KEYWORDS\n${keywords}\n\nEnter the terms in BCI’s Keyword(s) control. Use the supported match mode; if OR/multiple terms are unavailable, run separate searches for the phrases.\n\nPrioritise a confirmed open door package and its purchasing owner. A main-contract award is not proof of a placed door-package order. Recent project updates are not proof of open procurement. Search tender and non-tender routes; contact developers/architects early for specification, contractor QS/procurement or door specialists for buying, and property/facilities managers for occupied-building upgrades. Broad door searches may find irrelevant hits; narrow only after checking scope. Confirm scope, package status, quote deadline, supplier order and the actual buyer before pursuing.`;
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
const outreachRoutes = [
 {id:'main',title:'Projects · Main contractor',strategy:'Qualify the door-package buying window. Speak to QS/procurement, project manager or the appointed door specialist. Confirm who places the order.',subject:'{project} — door package status',opening:'Hi {name}, I’m {sender} from Faishak. We support door hardware, seals, automatic entrances and sliding systems. For {project}, may I check whether the {package} package has been awarded or ordered, and who handles it? If it is still open, I can help review the schedule and relevant product documents.',follow:'Hi {name}, following up on the package status for {project}. Is it still being priced, awaiting approval or already placed? If another team handles purchasing, could you point me to the right person?'},
 {id:'specifier',title:'Projects · Developer / Architect',strategy:'Early design: understand the specification intent, performance and decision process. At tender or construction stage, ask about approved substitutions rather than assuming changes are welcome.',subject:'{project} — door specification support',opening:'Hi {name}, I’m {sender} from Faishak. For {project}, we can help with door hardware and sealing selections alongside entrance and sliding systems. Are the {package} requirements still being developed, or is the schedule already fixed? I’d like to understand the design intent and which technical documents would be useful.',follow:'Hi {name}, would a short review of the {package} requirements for {project} be useful? We can focus on the specified function, compatible interfaces and supporting documents. If the specification is fixed, please let me know the route for any alternatives.'},
 {id:'cold',title:'Cold · New prospect',strategy:'Introduce yourself without assuming there is a live project. Ask about their role and a relevant need; earn permission for a short conversation before sending a catalogue.',subject:'Introduction — Faishak door and hardware support',opening:'Hi {name}, I’m {sender} from Faishak. We help project teams with door hardware, sealing systems, automatic entrances and sliding/pocket solutions. I’m getting to know the team at {company}; do you handle these requirements, or is there someone else I should introduce myself to? If relevant, may I send a brief overview tailored to your work?',follow:'Hi {name}, just following up on my introduction. Which types of door or hardware requirements does your team handle most often? I’m happy to share a relevant example rather than a full catalogue.'},
 {id:'facilities',title:'Property / Facilities manager',strategy:'Start with an operational problem: failed closers, draughts, privacy, access or maintenance. Establish property, responsibility and planned replacement budget; avoid new-build tender language.',subject:'{company} — door maintenance and upgrade support',opening:'Hi {name}, I’m {sender} from Faishak. We support door hardware and sealing requirements for building teams. Are there recurring door-closing, locking, noise or entrance-access issues at your properties, or any planned replacements? I’d like to understand the problem before suggesting products.',follow:'Hi {name}, is there a current door issue or planned upgrade where technical selection support would help? If your maintenance contractor handles this, who should I coordinate with?'},
 {id:'specialist',title:'Door supplier / Specialist',strategy:'Discuss the actual door schedule, component compatibility and supply deadlines with the team assembling or installing the package.',subject:'{project} — hardware and seal coordination',opening:'Hi {name}, I’m {sender} from Faishak. Are you supplying or installing doors for {project}? If you handle the {package} selection, we can review the schedule, door preparation and compatible hardware/seals. What is still open, and when are approvals and delivery required?',follow:'Hi {name}, which items in the {project} door schedule are still being selected or priced? If everything is placed, I’m happy to connect for your next package instead.'}
];
const cadences = [
 {day:'Day 0',channel:'Email',goal:'Introduce yourself / qualify relevance'},
 {day:'Day 2',channel:'Call',goal:'If no reply, check the right person and timing'},
 {day:'Day 4',channel:'WhatsApp',goal:'If appropriate and permitted, send a short follow-up'},
 {day:'Day 8',channel:'Email',goal:'Offer relevant technical help without pressure'},
 {day:'Day 14',channel:'Email',goal:'Close the loop; pause unless there is a reason to continue'}
];
let activeSequence = outreachRoutes[0], activeStep = 0, selectedContactId = '', outreachDraft = '';
byId('sequenceTabs').insertAdjacentHTML('beforebegin', `<div class="card contact-crm"><div class="panel-title"><div><h2>Contact workspace</h2><p class="mini muted">Save contacts, start a sequence and log your own outreach.</p></div><button id="addOutreachContact" class="primary">+ Add contact</button></div><div id="contactList"></div><div class="form-columns"><label>Your name<input id="outreachSender" maxlength="100" placeholder="Syafiee"></label><label>Contact<select id="selectedContact"><option value="">Choose a saved contact</option></select></label></div><div class="outreach-actions"><button id="startSequence" class="primary">Start selected sequence</button><button id="editOutreachContact">Edit contact</button><button id="pauseSequence">Pause sequence</button><button id="resumeSequence">Resume paused sequence</button><button id="stopContact">Mark opted out</button></div><p id="contactSequenceStatus" class="mini" aria-live="polite"></p><div id="contactActivity"></div></div>`);
document.body.insertAdjacentHTML('beforeend', `<dialog id="contactDialog" aria-labelledby="contactDialogTitle"><div class="panel-title"><h2 id="contactDialogTitle">Contact details</h2><button id="closeContactDialog" aria-label="Close">×</button></div><form id="contactForm"><input type="hidden" name="id"><div class="form-columns"><label>Name<input name="name" required maxlength="160"></label><label>Company<input name="company" required maxlength="200"></label></div><label>Role<select name="role"><option>Main contractor / QS / procurement</option><option>Developer / architect</option><option>New prospect</option><option>Property / facilities manager</option><option>Door supplier / specialist</option></select></label><div class="form-columns"><label>Email<input name="email" type="email" maxlength="200"></label><label>Phone / WhatsApp<input name="phone" placeholder="International format: +65 8123 4567" maxlength="30"></label></div><label><input name="whatsappAllowed" type="checkbox"> WhatsApp is appropriate and permitted for this contact</label><label>Project (optional)<input name="project" maxlength="200"></label><label>Relevant package<input name="package" maxlength="200"></label><label>Notes<textarea name="notes" maxlength="4000"></textarea></label><button class="primary" type="submit">Save contact</button></form></dialog>`);
function selectedContact(){ return (s.contacts || []).find(c=>c.id===selectedContactId); }
function renderContactList(){
 s.contacts ??= [];
 const select=byId('selectedContact'); select.innerHTML='<option value="">Choose a saved contact</option>'+s.contacts.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)} · ${escapeHTML(c.company)}</option>`).join('');select.value=selectedContactId;
 byId('contactList').innerHTML=s.contacts.length?`<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Contact</th><th>Company / role</th><th>Sequence</th><th>Last activity</th></tr></thead><tbody>${s.contacts.map(c=>`<tr><td><button class="crm-opportunity" data-select-contact="${escapeHTML(c.id)}">${escapeHTML(c.name)}</button></td><td>${escapeHTML(c.company)}<small>${escapeHTML(c.role)}</small></td><td>${escapeHTML(c.optedOut?'Opted out':c.sequence?.status || 'Not started')}</td><td>${escapeHTML(c.activity?.at(-1)?.date || '—')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Add your first contact to begin.</p>';
 byId('contactList').querySelectorAll('[data-select-contact]').forEach(b=>b.onclick=()=>chooseContact(b.dataset.selectContact));
 const c=selectedContact();
 byId('contactSequenceStatus').textContent=c ? `${c.name} · ${c.optedOut?'Opted out — do not contact':c.sequence ? `${c.sequence.status} · ${outreachRoutes.find(r=>r.id===c.sequence.route)?.title || c.sequence.route} · step ${Math.min(c.sequence.step+1,5)} of 5 · started ${c.sequence.started}`:'Sequence not started'}`:'Select a saved contact before starting outreach.';
 byId('contactActivity').innerHTML=c?.activity?.length?`<details><summary>Activity history (${c.activity.length})</summary>${plainList(c.activity.map(a=>`${a.date} · ${a.channel}: ${a.note}`))}</details>`:'';
 ['editOutreachContact','pauseSequence','resumeSequence','stopContact'].forEach(id=>byId(id).disabled=!c);
}
function chooseContact(id){selectedContactId=id;const c=selectedContact();if(c){byId('sequenceProject').value=c.project||'';byId('sequencePackage').value=c.package||'';if(c.sequence){activeSequence=outreachRoutes.find(r=>r.id===c.sequence.route)||outreachRoutes[0];activeStep=Math.min(c.sequence.step,4);}else activeStep=0;}renderContactList();renderSequence();}
function openContact(id=''){const c=s.contacts.find(c=>c.id===id);const f=byId('contactForm');f.reset();for(const key of ['id','name','company','role','email','phone','project','package','notes'])if(c && f.elements.namedItem(key))f.elements.namedItem(key).value=c[key]||'';if(c)f.elements.whatsappAllowed.checked=!!c.whatsappAllowed;byId('contactDialog').showModal();}
byId('addOutreachContact').onclick=()=>openContact();byId('editOutreachContact').onclick=()=>openContact(selectedContactId);byId('closeContactDialog').onclick=()=>byId('contactDialog').close();
byId('contactForm').onsubmit=e=>{e.preventDefault();const f=byId('contactForm'),d=new FormData(f);const phone=String(d.get('phone')||'').trim();if(phone && (!/^\+?[\d\s()-]+$/.test(phone)||!/^\d{8,15}$/.test(phone.replace(/\D/g,''))))return showToast('Use an international phone number including country code.');const prior=s.contacts.find(c=>c.id===d.get('id'));const c=prior||{id:crypto.randomUUID(),activity:[],sequence:null,optedOut:false};for(const k of ['name','company','role','email','phone','project','package','notes'])c[k]=String(d.get(k)||'').trim();c.whatsappAllowed=f.elements.whatsappAllowed.checked;c.lastUpdated=todaySG();if(!prior)s.contacts.push(c);selectedContactId=c.id;byId('contactDialog').close();save();chooseContact(c.id);showToast('Contact saved');};
byId('selectedContact').onchange=e=>chooseContact(e.target.value);
byId('startSequence').onclick=()=>{const c=selectedContact();if(!c)return showToast('Choose a saved contact first');if(c.optedOut)return showToast('This contact opted out. Do not start outreach.');if(c.sequence && !confirm('Start this sequence from step 1? Previous activity stays in history.'))return;c.sequence={route:activeSequence.id,step:0,started:todaySG(),status:'Active'};activeStep=0;save();renderSequence();};
byId('pauseSequence').onclick=()=>{const c=selectedContact();if(c?.sequence){c.sequence.status='Paused';save();renderSequence();}};
byId('resumeSequence').onclick=()=>{const c=selectedContact();if(!c || c.optedOut || c.sequence?.status!=='Paused')return showToast('Select a paused sequence for a contact who has not opted out.');c.sequence.status='Active';activeSequence=outreachRoutes.find(r=>r.id===c.sequence.route)||outreachRoutes[0];activeStep=Math.min(c.sequence.step,4);save();renderSequence();};
byId('stopContact').onclick=()=>{const c=selectedContact();if(c && confirm('Mark this contact as opted out and stop outreach?')){c.optedOut=true;if(c.sequence)c.sequence.status='Stopped';save();renderSequence();}};
function outreachMessage(){const c=selectedContact();let text=activeStep===0?activeSequence.opening:activeSequence.follow;if(activeStep===4)text='Hi {name}, I’ll close the loop on my earlier messages. If support with door hardware or sealing is useful in future, please feel free to reach out. Otherwise I’ll pause here. Thank you, {sender} — Faishak.';if(activeStep===1)text='Call opener: '+text+'\nIf they answer: ask one question, listen, and agree the next action. If no answer: log the attempt; continue only if appropriate.';const replacements={name:c?.name||'there',company:c?.company||'your company',sender:byId('outreachSender').value.trim()||'your Faishak contact',project:byId('sequenceProject').value.trim()||'your project',package:byId('sequencePackage').value.trim()||'door hardware and seals'};for(const [k,v]of Object.entries(replacements))text=text.replaceAll('{'+k+'}',v);return text;}
function renderSequence(){
 byId('sequenceTabs').querySelectorAll('[data-sequence]').forEach(b=>b.classList.toggle('on',b.dataset.sequence===activeSequence.id));
 byId('sequenceIntro').innerHTML=`<h3>${escapeHTML(activeSequence.title)}</h3><p>${escapeHTML(activeSequence.strategy)}</p><p class="mini muted">Day offsets are suggested, not automated deadlines. A reply replaces the cadence with an agreed next step; stop after the final unanswered attempt.</p>`;
 byId('sequenceDiagram').innerHTML=cadences.map((step,i)=>`<button data-step="${i}" class="sequence-node ${i===activeStep?'selected':''}"><span>${step.day}${selectedContact()?.sequence?.route===activeSequence.id ? " · " + new Date(Date.parse(selectedContact().sequence.started) + [0,2,4,8,14][i]*86400000).toISOString().slice(0,10) : ""}</span><b>${step.channel}</b><small>${step.goal}</small></button>${i<4?'<span class="sequence-arrow" aria-hidden="true">→</span>':''}`).join('');
 byId('sequenceDiagram').querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{activeStep=Number(b.dataset.step);renderSequence();});
 const c=selectedContact(),step=cadences[activeStep];outreachDraft=outreachMessage();
 let subject=activeSequence.subject.replaceAll('{project}',byId('sequenceProject').value||'your project').replaceAll('{company}',c?.company||'your company');
 byId('sequenceStep').innerHTML=`<h3>${step.day} · ${step.channel}</h3><p>${step.goal}</p><label>Email subject<input id="sequenceSubject" maxlength="250"></label><label>Review / edit message<textarea id="sequenceMessage" rows="7"></textarea></label><div class="notice mini">If they respond: record the outcome and pause the sequence. If wrong contact: ask for the owner and stop this cadence. If no reply: continue at the suggested interval only when relevant. Opening a draft does not mean it was sent.</div><div class="outreach-actions"><button id="copySequence">Copy message</button><a id="sendEmail" class="primary">Open email draft</a><a id="sendWhatsApp" class="primary" target="_blank" rel="noopener noreferrer">Open WhatsApp Web</a><a id="callContact">Call</a></div><label>Outcome / next action<textarea id="outreachOutcome" maxlength="2000" placeholder="No reply, spoke to QS, package already ordered, follow up on agreed date…"></textarea></label><div class="outreach-actions"><button id="completeOutreachStep" class="primary">Log completed step & continue</button><button id="logOutreachReply">Log reply & pause</button></div><p id="outreachLinkStatus" class="mini muted" aria-live="polite"></p>`;
 byId('sequenceSubject').value=subject;byId('sequenceMessage').value=outreachDraft;
 const links=()=>{const body=byId('sequenceMessage').value;const enabled=c && !c.optedOut;const phone=c?.phone?.replace(/\D/g,'');const email=byId('sendEmail'),wa=byId('sendWhatsApp'),call=byId('callContact');email.removeAttribute('href');wa.removeAttribute('href');call.removeAttribute('href');if(enabled && c.email)email.href='mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent(byId('sequenceSubject').value)+'&body='+encodeURIComponent(body);if(enabled && c.whatsappAllowed && phone)wa.href='https://web.whatsapp.com/send?phone='+encodeURIComponent(phone)+'&text='+encodeURIComponent(body);if(enabled && phone)call.href='tel:+'+phone;for(const el of [email,wa,call]){el.setAttribute('aria-disabled',String(!el.hasAttribute('href')));el.onclick=()=>{if(!el.hasAttribute('href')){showToast('Save the required contact details and confirm channel permission first.');return false;}};}byId('outreachLinkStatus').textContent=c?.optedOut?'Outreach blocked: this contact opted out.':'Drafts only: review and press Send in your email or WhatsApp app. Log completion separately.';};links();byId('sequenceMessage').oninput=links;byId('sequenceSubject').oninput=links;byId('copySequence').onclick=()=>copyText(byId('sequenceMessage').value);
 const log=(reply)=>{if(!c || c.optedOut || c.sequence?.status!=='Active' || c.sequence.route!==activeSequence.id || c.sequence.step!==activeStep)return showToast('Start an active sequence and select its current step before logging.');const note=byId('outreachOutcome').value.trim();if(!note)return showToast('Record the outcome or next action first.');c.activity??=[];c.activity.push({id:crypto.randomUUID(),date:todaySG(),channel:step.channel,note,message:byId('sequenceMessage').value,route:activeSequence.id,step:activeStep});if(reply)c.sequence.status='Paused';else{c.sequence.step++;if(c.sequence.step>=5)c.sequence.status='Completed';activeStep=Math.min(c.sequence.step,4);}save();renderSequence();showToast('Activity saved');};byId('completeOutreachStep').onclick=()=>log(false);byId('logOutreachReply').onclick=()=>log(true);
 renderContactList();
}
byId('sequenceTabs').innerHTML=outreachRoutes.map(r=>`<button data-sequence="${r.id}">${r.title}</button>`).join('');byId('sequenceTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{activeSequence=outreachRoutes.find(r=>r.id===b.dataset.sequence);activeStep=0;renderSequence();});byId('sequenceProject').oninput=renderSequence;byId('sequencePackage').oninput=renderSequence;byId('outreachSender').oninput=()=>{s.outreachSender=byId('outreachSender').value;save();renderSequence();};byId('outreachSender').onchange=()=>save();byId('outreachSender').value=s.outreachSender||'';renderContactList();renderSequence();
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
