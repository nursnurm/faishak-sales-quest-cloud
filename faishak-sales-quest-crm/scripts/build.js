const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, ".."),
  target = path.join(root, "public");
fs.mkdirSync(target, { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "knowledge.js",
  "workspace.js",
  "HOSTING.md",
  "BROWSER_SETUP.md",
  "public-config.json",
])
  fs.copyFileSync(path.join(root, file), path.join(target, file));
fs.mkdirSync(path.join(target, "assets"), { recursive: true });
fs.copyFileSync(
  path.join(root, "assets/dashboard-imagery.png"),
  path.join(target, "assets/dashboard-imagery.png"),
);
console.log(
  "Built public/ with dashboard assets. Netlify functions are deployed separately.",
);
