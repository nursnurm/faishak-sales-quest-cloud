const { json, publicConfig } = require("./lib/shared");
exports.handler = async (event) =>
  event.httpMethod === "GET"
    ? json(200, publicConfig())
    : json(405, { error: "Method not allowed" });
