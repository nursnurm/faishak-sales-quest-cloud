const json = (status, body, extra = {}) => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extra,
  },
  body: JSON.stringify(body),
});
const safeURL = (value) => {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
};
const bundledPublicConfig = require("../../../public-config.json");
const publicConfig = () => ({
  provider: process.env.FAISHAK_AI_PROVIDER || "gemini",
  supabaseUrl: process.env.SUPABASE_URL || bundledPublicConfig.supabaseUrl,
  supabaseKey:
    process.env.SUPABASE_PUBLISHABLE_KEY || bundledPublicConfig.supabaseKey,
  aiConfigured: Boolean(process.env.FAISHAK_AI_KEY),
  model:
    process.env.FAISHAK_AI_MODEL ||
    (process.env.FAISHAK_AI_PROVIDER === "openai"
      ? "gpt-4.1-mini"
      : "gemini-2.5-flash"),
});
async function requireUser(event) {
  const config = publicConfig();
  if (!config.supabaseUrl || !config.supabaseKey)
    throw Object.assign(
      new Error(
        "Cloud login is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in hosting settings.",
      ),
      { status: 503 },
    );
  const token = event.headers?.authorization || event.headers?.Authorization;
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(token || ""))
    throw Object.assign(new Error("Sign in to use AI."), { status: 401 });
  const response = await fetch(config.supabaseUrl + "/auth/v1/user", {
    headers: { apikey: config.supabaseKey, Authorization: token },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw Object.assign(new Error("Your login has expired. Sign in again."), {
      status: 401,
    });
  const user = await response.json();
  if (!user.id)
    throw Object.assign(new Error("Invalid login."), { status: 401 });
  return user;
}
module.exports = { json, safeURL, publicConfig, requireUser };
