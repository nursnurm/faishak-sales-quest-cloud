const { XMLParser } = require("fast-xml-parser");
const { json, safeURL } = require("./lib/shared");
const queries = {
  projects: "Singapore construction project contract award when:14d",
  transport: "Singapore MRT construction LTA contract when:30d",
  healthcare: "Singapore hospital healthcare construction project when:30d",
  doors: '(\"door hardware\" OR \"fire door\" OR \"acoustic sealing\" OR \"automatic door\") when:30d',
  sustainability:
    "Singapore building retrofit Green Mark construction when:30d",
};
const cache = new Map();
const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: true,
});
function parseFeed(xml) {
  const data = parser.parse(xml);
  const raw = data?.rss?.channel?.item;
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : [raw];
  return rows
    .slice(0, 16)
    .map((item) => {
      const source =
        typeof item.source === "object" ? item.source["#text"] : item.source;
      return {
        title: String(item.title || "").replace(/<[^>]*>/g, ""),
        url: safeURL(item.link),
        publisher: String(source || "Google News").replace(/<[^>]*>/g, ""),
        publishedAt: Number.isFinite(Date.parse(item.pubDate))
          ? new Date(item.pubDate).toISOString()
          : null,
      };
    })
    .filter((item) => item.title && item.url);
}
exports.handler = async (event) => {
  if (event.httpMethod !== "GET")
    return json(405, { error: "Method not allowed" });
  const topic = event.queryStringParameters?.topic || "projects";
  if (!queries[topic]) return json(400, { error: "Unknown news topic" });
  const prior = cache.get(topic);
  if (
    prior &&
    Date.now() - prior.cachedAt < 15 * 60 * 1000 &&
    event.queryStringParameters?.refresh !== "1"
  )
    return json(200, prior.body, { "Cache-Control": "public, max-age=300" });
  try {
    const url = new URL("https://news.google.com/rss/search");
    url.search = new URLSearchParams({
      q: queries[topic],
      hl: "en-SG",
      gl: "SG",
      ceid: "SG:en",
    }).toString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "FaishakSalesQuest/1.0" },
    });
    if (!response.ok) throw Error("Feed unavailable");
    const xml = await response.text();
    if (xml.length > 2000000) throw Error("Feed too large");
    const body = {
      items: parseFeed(xml),
      topic,
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    cache.set(topic, { cachedAt: Date.now(), body });
    return json(200, body, { "Cache-Control": "public, max-age=300" });
  } catch {
    if (prior)
      return json(200, {
        ...prior.body,
        stale: true,
        message: "Live refresh failed. Showing the last successful feed.",
      });
    return json(502, {
      error:
        "The news feed could not be reached. Try again after news.google.com access is available.",
      topic,
    });
  }
};
exports.parseFeed = parseFeed;
