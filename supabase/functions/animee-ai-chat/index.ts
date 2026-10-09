// Animee AI chat endpoint. Deploy as a Supabase Edge Function.
// Configure OPENAI_API_KEY as a Supabase secret; never place it in browser code.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://animee355.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
]);
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const requestCounts = new Map<string, { count: number; startedAt: number }>();

const headersFor = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://animee355.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});

const reply = (status: number, payload: Record<string, unknown>, origin: string | null) =>
  new Response(JSON.stringify(payload), { status, headers: headersFor(origin) });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: headersFor(origin) });
  if (origin && !allowedOrigins.has(origin)) return reply(403, { error: "This website is not allowed to use Animee AI." }, origin);
  if (req.method !== "POST") return reply(405, { error: "Use POST to send a question." }, origin);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip") || "unknown";
  const now = Date.now();
  const bucket = requestCounts.get(ip);
  if (bucket && now - bucket.startedAt < WINDOW_MS && bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return reply(429, { error: "You've sent several questions very quickly. Please wait a minute and try again." }, origin);
  }
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) requestCounts.set(ip, { count: 1, startedAt: now });
  else bucket.count += 1;

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return reply(503, { error: "Animee AI is not configured yet. The site owner needs to add the OpenAI API key to Supabase." }, origin);

  let body: { messages?: unknown };
  try { body = await req.json(); }
  catch { return reply(400, { error: "Please send a valid question." }, origin); }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 10) {
    return reply(400, { error: "Please send a question with a short conversation history." }, origin);
  }
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  for (const item of body.messages) {
    if (!item || (item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string") {
      return reply(400, { error: "The conversation format is invalid." }, origin);
    }
    const content = item.content.trim();
    if (!content || content.length > 2000) return reply(400, { error: "Each message must be between 1 and 2,000 characters." }, origin);
    messages.push({ role: item.role, content });
  }
  if (messages[messages.length - 1]?.role !== "user") return reply(400, { error: "Please send a question." }, origin);

  const systemPrompt = `You are Animee AI, a helpful, friendly general-purpose assistant for visitors to Animee — Where Anime Comes to Life. You can answer general knowledge questions and help with anime recommendations, series information, episode summaries, watch-order guidance, captions, and creator questions. Be clear, concise, respectful, and honest. Do not pretend to have checked live news, schedules, or current facts unless you have a tool that actually did so. Anime details can vary by adaptation; say when uncertain and recommend checking official sources for release dates or announcements. Never claim to be a human or the official representative of an anime studio. Do not provide full copyrighted scripts, episode transcripts, or pirated-streaming links; summaries and legal viewing guidance are fine. For medical, legal, financial, or other high-impact topics, provide general information and encourage qualified professional help when appropriate.`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_completion_tokens: 700,
        temperature: 0.6,
      }),
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("OpenAI request failed:", upstream.status, result?.error?.code || "unknown");
      if (upstream.status === 429) return reply(429, { error: "Animee AI is busy right now. Please try again shortly." }, origin);
      return reply(502, { error: "Animee AI could not generate an answer right now. Please try again later." }, origin);
    }
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return reply(502, { error: "No answer was returned. Please try again." }, origin);
    return reply(200, { answer: answer.trim() }, origin);
  } catch (error) {
    console.error("Animee AI network error:", error);
    return reply(502, { error: "Could not reach the AI service. Please try again later." }, origin);
  }
});
