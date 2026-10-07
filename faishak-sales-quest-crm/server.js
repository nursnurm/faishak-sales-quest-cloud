const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const handlers = {
  config: require("./netlify/functions/config").handler,
  news: require("./netlify/functions/news").handler,
  ai: require("./netlify/functions/ai").handler,
};
const files = new Set([
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/knowledge.js",
  "/workspace.js",
  "/HOSTING.md",
  "/BROWSER_SETUP.md",
  "/public-config.json",
]);
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/.netlify/functions/")) {
      const name = url.pathname.split("/").at(-1);
      if (!handlers[name]) {
        res.writeHead(404);
        return res.end("Not found");
      }
      let body = "";
      try {
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 3200000) {
            res.writeHead(413);
            return res.end("Request too large");
          }
        }
        const result = await handlers[name]({
          httpMethod: req.method,
          headers: req.headers,
          queryStringParameters: Object.fromEntries(url.searchParams),
          body,
        });
        res.writeHead(result.statusCode, result.headers);
        return res.end(result.body);
      } catch {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Server request failed." }));
      }
    }
    if (
      !files.has(url.pathname) &&
      !/^\/assets\/[a-zA-Z0-9._-]+$/.test(url.pathname)
    ) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const file = path.join(
      __dirname,
      url.pathname === "/" ? "index.html" : url.pathname,
    );
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404);
        return res.end("Not found");
      }
      const types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".md": "text/plain; charset=utf-8",
        ".json": "application/json; charset=utf-8",
      };
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(data);
    });
  })
  .listen(process.env.PORT || 3000, "0.0.0.0", () =>
    console.log(
      "Faishak Sales Quest running on port " + (process.env.PORT || 3000),
    ),
  );
