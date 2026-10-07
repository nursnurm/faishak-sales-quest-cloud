const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const html = fs.readFileSync("index.html", "utf8");
for (const file of ["app.js", "knowledge.js", "workspace.js"])
  new vm.Script(fs.readFileSync(file, "utf8"));
const ids = [...html.matchAll(/id=["']([^"']+)["']/g)].map((m) => m[1]);
assert.equal(ids.length, new Set(ids).size, "Duplicate element IDs");
for (const id of [
  "home",
  "campaign",
  "bci",
  "products",
  "competitors",
  "outreach",
  "sim",
  "events",
  "projects",
  "pipeline",
  "coaching",
])
  assert(ids.includes(id), "Missing module " + id);
console.log("Scripts parse; unique IDs; all 11 modules present.");
