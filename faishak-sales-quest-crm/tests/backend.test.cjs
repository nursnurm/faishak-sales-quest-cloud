const test = require("node:test");
const assert = require("node:assert/strict");
const { parseFeed } = require("../netlify/functions/news");
const {
  buildRequest,
  extractResult,
  handler,
} = require("../netlify/functions/ai");
const config = require("../netlify/functions/config");
test("RSS extracts real titles, dates and safe source links", () => {
  const rows = parseFeed(
    '<rss><channel><item><title><![CDATA[Singapore &amp; construction]]></title><link>https://news.google.com/rss/articles/abc</link><pubDate>Wed, 07 Oct 2026 08:00:00 GMT</pubDate><source url="https://example.com">Industry News</source></item><item><title>Unsafe</title><link>javascript:alert(1)</link></item></channel></rss>',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].publisher, "Industry News");
  assert(rows[0].title.includes("Singapore"));
  assert.equal(rows[0].publishedAt, "2026-10-07T08:00:00.000Z");
});
test("practice carries multi-turn history and limits output", () => {
  const r = buildRequest({
    operation: "practice",
    history: [
      { role: "customer", text: "Existing supplier" },
      { role: "seller", text: "What would a review need?" },
    ],
    interest: 30,
  });
  assert.equal(JSON.parse(r.input[0].content[0].text).history.length, 2);
  assert.equal(r.store, false);
  assert(!r.tools);
  assert(r.instructions.includes("between -15 and 15"));
});
test("competitor uses source review and refuses oversized PDFs", () => {
  const r = buildRequest({
    operation: "competitor",
    name: "Test brand",
    evidence: "document text",
  });
  assert.equal(r.tools[0].type, "web_search");
  assert(r.instructions.includes("untrusted"));
  assert.throws(
    () =>
      buildRequest({
        operation: "competitor",
        name: "Brand",
        pdf: "data:application/pdf;base64," + "A".repeat(3000000),
      }),
    /smaller/,
  );
});
test("extracts JSON from Responses API output", () =>
  assert.deepEqual(
    extractResult({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: '{"customerReply":"Hello"}' }],
        },
      ],
    }),
    { customerReply: "Hello" },
  ));
test("AI requires authentication and clamps simulated deltas", async () => {
  const originalFetch = global.fetch;
  const saved = { ...process.env };
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-public-config";
  process.env.FAISHAK_AI_KEY = "test-only-not-a-credential";
  process.env.FAISHAK_AI_PROVIDER = "openai";
  let apiCalled = false;
  global.fetch = async (url) => {
    if (String(url).endsWith("/auth/v1/user"))
      return new Response(JSON.stringify({ id: "test-user" }));
    apiCalled = true;
    return new Response(
      JSON.stringify({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  customerReply: "What would you suggest?",
                  feedback: "Useful discovery.",
                  delta: 999,
                  outcome: "unexpected",
                }),
              },
            ],
          },
        ],
      }),
    );
  };
  try {
    const unauthorized = await handler({
      httpMethod: "POST",
      headers: {},
      body: "{}",
    });
    assert.equal(unauthorized.statusCode, 401);
    assert(!apiCalled);
    const response = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer test.mock.token" },
      body: JSON.stringify({ operation: "practice", history: [] }),
    });
    assert.equal(response.statusCode, 200);
    assert.equal(JSON.parse(response.body).result.delta, 15);
    assert.equal(JSON.parse(response.body).result.outcome, "continue");
    assert(apiCalled);
  } finally {
    global.fetch = originalFetch;
    for (const name of [
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
      "FAISHAK_AI_KEY",
      "FAISHAK_AI_PROVIDER",
    ]) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  }
});
test("public configuration never returns the AI secret", async () => {
  const saved = process.env.FAISHAK_AI_KEY;
  process.env.FAISHAK_AI_KEY = "test-only-not-a-credential";
  try {
    const response = await config.handler({ httpMethod: "GET" });
    assert(!response.body.includes("test-only-not-a-credential"));
    assert.equal(JSON.parse(response.body).aiConfigured, true);
  } finally {
    if (saved === undefined) delete process.env.FAISHAK_AI_KEY;
    else process.env.FAISHAK_AI_KEY = saved;
  }
});
test("free-tier Gemini route sends the key server-side and parses provider output", async () => {
  const originalFetch = global.fetch,
    saved = { ...process.env };
  Object.assign(process.env, {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "public-test-config",
    FAISHAK_AI_KEY: "test-only-not-a-credential",
    FAISHAK_AI_PROVIDER: "gemini",
  });
  delete process.env.FAISHAK_AI_MODEL;
  let request;
  global.fetch = async (url, options) => {
    if (String(url).endsWith("/auth/v1/user"))
      return new Response(JSON.stringify({ id: "test-user" }));
    assert(String(url).includes("generativelanguage.googleapis.com"));
    assert(!String(url).includes("test-only-not-a-credential"));
    assert.equal(
      options.headers["x-goog-api-key"],
      "test-only-not-a-credential",
    );
    request = JSON.parse(options.body);
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    customerReply: "What package?",
                    feedback: "Good discovery.",
                    delta: -4,
                    outcome: "continue",
                  }),
                },
              ],
            },
          },
        ],
      }),
    );
  };
  try {
    const result = await handler({
      httpMethod: "POST",
      headers: { authorization: "Bearer mock.test.token" },
      body: JSON.stringify({ operation: "practice" }),
    });
    assert.equal(result.statusCode, 200);
    assert.equal(JSON.parse(result.body).result.delta, -4);
    assert.equal(request.generationConfig.responseMimeType, "application/json");
  } finally {
    global.fetch = originalFetch;
    for (const key of [
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
      "FAISHAK_AI_KEY",
      "FAISHAK_AI_PROVIDER",
      "FAISHAK_AI_MODEL",
    ]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});
test("pipeline report separates recent activity, edited records and stale risks", () => {
  const today = new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Singapore'});
  const old = new Date(Date.parse(today)-30*86400000).toISOString().slice(0,10);
  const future = new Date(Date.parse(today)+10*86400000).toISOString().slice(0,10);
  const req = buildRequest({operation:'pipeline_report',days:7,endDate:'2099-01-01',opportunities:[
    {name:'Hospital',company:'Builder',stage:'RFQ',value:12000,lastUpdated:today,nextAction:'',dueDate:old,updates:[{date:old,text:'Old activity'},{date:today,text:'Pricing blocked'},{date:future,text:'Future note'}]},
    {name:'Stale project',stage:'Qualified',lastUpdated:old,updates:[]}
  ]});
  const body = JSON.parse(req.input[0].content[0].text);
  assert.equal(body.endDate,today);
  assert.equal(body.opportunities[0].recentActivity.length,1);
  assert.equal(body.opportunities[0].recentActivity[0].text,'Pricing blocked');
  assert(body.opportunities[0].flags.includes('Next action overdue'));
  assert(body.opportunities[1].flags.includes('No update in 14 days'));
  assert(!req.tools);
  assert(req.instructions.includes('never infer customer progress'));
  assert.throws(()=>buildRequest({operation:'pipeline_report',opportunities:[]}),/between 1 and 200/);
});
