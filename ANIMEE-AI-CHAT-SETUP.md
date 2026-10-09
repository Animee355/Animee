# Animee AI Chat Setup

The floating **Ask Animee AI** chat widget is added to the website/PWA. Its server endpoint is a Supabase Edge Function so the OpenAI API key is never exposed in public JavaScript.

## One-time setup required

The widget will display a configuration message until the Edge Function is deployed and the API key is added. GitHub Pages cannot securely run a private AI API key by itself.

### 1. Add your OpenAI API key to Supabase

1. Create an API key from your OpenAI platform account if you do not already have one.
2. Open the [Animee Supabase Edge Function Secrets page](https://supabase.com/dashboard/project/mnfzpbwhvierboadwctz/functions/secrets).
3. Add a secret with **Name** `OPENAI_API_KEY` and **Value** your real OpenAI API key, then save it.
4. Never paste the key into a public chat, website file, or GitHub commit. Set usage limits/budget alerts in your OpenAI platform account.

### 2. Enable automatic deployments from GitHub

The repository now includes a GitHub Actions workflow at `.github/workflows/deploy-animee-ai.yml`. It deploys the AI function when its code changes on `main`, or when manually run.

1. Create a Supabase access token from [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens).
2. Open [Animee GitHub Actions secrets](https://github.com/Animee355/Animee/settings/secrets/actions).
3. Add a repository secret named `SUPABASE_ACCESS_TOKEN` and paste the Supabase access token as its value.
4. Open [Animee AI workflow](https://github.com/Animee355/Animee/actions/workflows/deploy-animee-ai.yml), select **Run workflow**, and run it on `main`.
5. Open the workflow run and confirm the deployment job succeeds.

If you prefer manual deployment, install the Supabase CLI, run `npx supabase login`, then run `npx supabase link --project-ref mnfzpbwhvierboadwctz` and `npx supabase functions deploy animee-ai-chat` from the repository root.

## Security and accuracy notes

The function is public so visitors can ask questions without signing in. It validates message size, restricts browser origins, and includes a basic per-instance request limit. That limit is not a complete abuse-prevention system because serverless instances can scale; review usage and set provider spending limits.

The AI endpoint is configured to use OpenAI's hosted web search tool for factual questions and return clickable source links when sources are available. Search results cover relevant indexed and accessible pages—not every website on the internet—and citations should be checked for important claims. Search availability and model/API usage may incur costs. The AI can still make mistakes, so it should never promise perfect accuracy.

## Files

- `supabase/functions/animee-ai-chat/index.ts` — AI endpoint
- `supabase/config.toml` — function JWT setting
- `pwa.js` — floating chat UI shared across site pages
- `.github/workflows/deploy-animee-ai.yml` — automated deployment workflow
