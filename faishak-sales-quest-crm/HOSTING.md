For the current browser-only setup, follow [BROWSER_SETUP.md](BROWSER_SETUP.md).

# Publish Faishak Sales Quest

The app is prepared for Netlify + Supabase + a server-side Gemini connection. Your Supabase project URL and public publishable key are bundled in public-config.json. Database setup and a signed-in connection still need validation. The app is not yet published, and the AI key is not configured. A static-only upload cannot run news or AI functions. ChatGPT is not the hosting provider.

## 1. Prepare Supabase

1. Your project is https://supabase.com/dashboard/project/mvyyyleqogjdswgvucrf.
2. Run `database/schema.sql` in its SQL editor. This enables row-level security: each authenticated user can read and update only their own workspace. Do not use a service-role key in the app.
3. Enable email/password authentication. Keep email confirmation enabled and configure the published app URL in Supabase authentication settings.
4. Copy the project URL and public publishable key for hosting configuration. These are public configuration, not the secret service-role key.

## 2. Deploy on Netlify

Import this project from a Git repository into Netlify. `netlify.toml` sets the build command, public directory and functions directory. Alternatively, an authenticated Netlify CLI can deploy the prepared application:

```
npm ci
npm run check
npm test
npm run build
netlify deploy --prod --dir=public --functions=netlify/functions
```

The Supabase public connection is already included. Hosting environment variables can override it. To connect AI, set the following variables in Netlify settings, then redeploy:

| Name                     | Value                                                           |
| ------------------------ | --------------------------------------------------------------- |
| SUPABASE_URL             | Your standard https://PROJECT.supabase.co URL                   |
| SUPABASE_PUBLISHABLE_KEY | The public publishable / anon key                               |
| FAISHAK_AI_KEY           | Your free-tier Gemini API key, entered securely on Netlify only |
| FAISHAK_AI_PROVIDER      | gemini (default); optional openai uses a paid API               |
| FAISHAK_AI_MODEL         | Optional; defaults to gemini-2.5-flash for Gemini               |

Use variables available to server functions. Never insert FAISHAK_AI_KEY in HTML, browser JavaScript, Git, or chat. Use the free Gemini tier without enabling paid billing. Free usage is subject to availability, model access and quotas; when a quota is reached the app reports it rather than upgrading. OpenAI is an optional paid provider and is not required. AI routes require a valid Supabase login. Use provider usage limits appropriate to your account. Supabase auth project and the public configuration must point to the same project.

Netlify returns a stable HTTPS URL. You can attach your own domain later. Open that same URL and sign in on Mac and Windows.

## 3. Start your shared workspace

Create an account using the cloud button, confirm your email, then sign in. Import the local workspace once if no cloud workspace exists. On another device, sign in and load the existing cloud workspace. Successful changes save automatically after a short delay. The cloud button shows saving, synced and conflict states. Another device's newer revision triggers a conflict rather than an overwrite. Before loading the cloud version, local records are backed up in browser storage.

Syncing is automatic on edits, not a live multi-user collaboration system. Use Load latest cloud workspace when switching devices or after a revision conflict. The account button makes the current storage mode visible. Closing the browser before a pending cloud save completes can leave the last change local; wait for Cloud synced.

## 4. Validate the published app

- `/.netlify/functions/config` returns only public configuration and AI connection status.
- Create two test accounts and confirm each sees only its own workspace.
- On one account, create an opportunity and dated update. Load it on the other device.
- Click RSS Refresh and confirm source headlines, publication dates and last-update time.
- Start an AI conversation; ensure customer replies and positive/negative feedback are genuine API responses.
- Analyse a brand or PDF, check source support, then approve the proposed library entry.
- Refresh 2026 events and confirm dates with organiser sources. AI source links are not independent verification.

## Local development

Node.js 24 is required. `npm ci`, then `npm start`. Inject environment variables through your shell or a secure environment manager; `.env` files are not read automatically. Without cloud/AI configuration the local pipeline, plan, Academy, playbook and reports still work. AI features show a clear connection message rather than using fake responses.

News requires network access to news.google.com. Gemini requires generativelanguage.googleapis.com. Optional OpenAI requires api.openai.com. Supabase requires your exact project hostname. Official brand and event information is retrieved using server-side web search. RSS news is cached for 15 minutes, can be refreshed, and updates while the page is visible.

## Knowledge still needed

The uploaded archive contained HTML, not the Faishak catalogue. Supply the catalogue to verify represented brands, exact models, certifications, territories and project references. Until then, Academy origins and application guidance are general references and competitor names are research candidates. No unsupported competitive weakness is labelled as fact.

## Free plans

Start with the Supabase free plan and Netlify free plan. They have usage limits and service restrictions; check current terms at https://supabase.com/pricing and https://www.netlify.com/pricing/. No plan purchase or billing activation is performed by this project.

For AI, create a Gemini key in Google AI Studio at https://aistudio.google.com/ and use a model available in its free tier. Check current model, grounding, region and quota terms at https://ai.google.dev/gemini-api/docs/pricing. Google’s free-service data terms differ from paid-service terms; review them before sending confidential company documents. API quota errors leave your local records unchanged.

## Current project connection

The public key provided is a publishable key, suitable for client-side configuration. It does not grant SQL-editor or administrator access. Open https://supabase.com/dashboard/project/mvyyyleqogjdswgvucrf/sql/new, paste the contents of database/schema.sql and run it. Email/password authentication must be enabled. No account signup or data insert was performed during connection setup.

Static hosting can use the bundled public-config.json to enable Supabase login and direct database requests once the schema exists. Netlify server functions are still needed for RSS and AI.
