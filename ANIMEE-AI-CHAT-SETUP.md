# Animee AI Chat Setup

The floating **Ask Animee AI** chat widget is added to the website/PWA. Its server endpoint is a Supabase Edge Function so the OpenAI API key is never exposed in public JavaScript.

## One-time setup required

The widget will display a configuration message until the Edge Function is deployed and the API key is added. GitHub Pages cannot securely run a private AI API key by itself.

1. Install the Supabase CLI and sign in:
   `npx supabase login`
2. From the repository root, link the existing project:
   `npx supabase link --project-ref mnfzpbwhvierboadwctz`
3. Add your OpenAI API key as a Supabase secret (replace the placeholder locally; do not commit the real key):
   `npx supabase secrets set OPENAI_API_KEY=your_openai_api_key`
4. Deploy the function:
   `npx supabase functions deploy animee-ai-chat`
5. In your OpenAI platform account, set usage limits/budget alerts so unexpected traffic cannot create a large bill.

The function is public so visitors can ask questions without signing in. It validates message size, restricts browser origins, and includes a basic per-instance request limit. That limit is not a complete abuse-prevention system because serverless instances can scale; review usage and set provider spending limits.

## Files

- `supabase/functions/animee-ai-chat/index.ts` — AI endpoint
- `supabase/config.toml` — function JWT setting
- `pwa.js` — floating chat UI shared across site pages

The AI endpoint is configured to use OpenAI's hosted web search tool for factual questions and return clickable source links when sources are available. Search results cover relevant indexed and accessible pages—not every website on the internet—and citations should be checked for important claims. Search availability and model/API usage may incur costs. The AI can still make mistakes, so it should never promise perfect accuracy.
