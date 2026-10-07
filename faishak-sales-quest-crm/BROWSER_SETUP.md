# Enable RSS and Gemini on the existing Netlify site

Use the free plans. The app continues to use https://regal-dango-1178cb.netlify.app and the existing Supabase project. You do not need to import your workspace again.

## Connect the code

1. Open your existing Netlify project, **regal-dango-1178cb**.
2. Go to **Project configuration → Build & deploy → Continuous deployment** and choose **Link repository** (the button may say **Link to a Git repository**).
3. Choose GitHub, authorise access to `nursnurm/web3-demo`, then select that repository.
4. Choose production branch **faishak-sales-quest-cloud**.
5. Leave base directory empty. Build command is **npm run build** and publish directory is **public**. `netlify.toml` also configures **netlify/functions**.
6. Save and let Netlify build. Once it succeeds, open `https://regal-dango-1178cb.netlify.app/.netlify/functions/config`. A JSON response means functions are deployed. The config response exposes only the public Supabase connection and AI connection status, never the AI key.

RSS needs no API key. Home → Industry Briefing → Refresh should load source headlines.

## Connect free-tier Gemini

1. Open https://aistudio.google.com/api-keys and create a Gemini API key in a project using the free tier. Do not enable paid billing. Confirm the chosen model and region have free-tier access at https://ai.google.dev/gemini-api/docs/pricing.
2. In the same Netlify project, open **Project configuration → Environment variables → Add a variable**.
3. Set the name to **FAISHAK_AI_KEY** and paste the key into its value privately. Mark it secret if offered. It must be available to Functions in the Production context; use all scopes if your plan does not offer scope selection.
4. The provider defaults to **gemini** and the model to **gemini-2.5-flash**. Optional overrides are **FAISHAK_AI_PROVIDER=gemini** and **FAISHAK_AI_MODEL=gemini-2.5-flash**. Never put an AI key in public-config.json, GitHub or chat.
5. Trigger a production deploy after saving the variable.
6. Sign in to the dashboard and start Sales Practice. Test one reply. Then test competitor analysis and Events Radar refresh. If the free quota is exhausted, the app reports it and does not upgrade plans.

## Finish verification

Send the successful Netlify deployment URL or a screenshot of any build error. AI key presence alone does not prove it works: the first authenticated conversation validates the actual provider connection. Source-linked event suggestions still need organiser verification.

If GitHub does not list the repository, use Netlify's GitHub app settings to grant access to that repository. Do not create a new Netlify site: continuing with the same site keeps the URL, Supabase login redirects and browser-local records consistent.
