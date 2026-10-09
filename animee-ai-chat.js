(() => {
  "use strict";
  const SUPABASE_URL = "https://mnfzpbwhvierboadwctz.supabase.co";
  const SUPABASE_PUBLIC_KEY = "sb_publishable_XV2dfLKtRHyIRcQBcwlaXA_QX61BvXW";
  if (document.getElementById("animee-ai-launcher")) return;

  const style = document.createElement("style");
  style.textContent = `
    #animee-ai-launcher{position:fixed;right:18px;bottom:82px;z-index:9997;border:0;border-radius:999px;padding:13px 17px;background:linear-gradient(110deg,#07518a,#0878b8);color:white;font:800 14px system-ui;box-shadow:0 8px 28px #06345555;cursor:pointer}
    #animee-ai-panel{position:fixed;right:18px;bottom:140px;z-index:9997;width:min(390px,calc(100vw - 24px));height:min(560px,calc(100dvh - 170px));display:none;grid-template-rows:auto 1fr auto;background:#071a2d;color:#f4f8ff;border:1px solid #75ddff77;border-radius:18px;overflow:hidden;box-shadow:0 20px 70px #0008;font:14px/1.5 system-ui,Segoe UI,Arial,sans-serif}
    #animee-ai-panel.open{display:grid}#animee-ai-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;background:linear-gradient(110deg,#0d3152,#07518a);border-bottom:1px solid #75ddff44}
    #animee-ai-head strong{font-size:15px}#animee-ai-head small{display:block;color:#c8edff;font-size:11px}
    #animee-ai-close{background:transparent;color:white;border:0;font-size:23px;cursor:pointer;padding:0 5px}
    #animee-ai-log{overflow:auto;padding:13px;display:flex;flex-direction:column;gap:10px}
    .animee-ai-msg{white-space:pre-wrap;overflow-wrap:anywhere;max-width:92%;padding:10px 12px;border-radius:13px}
    .animee-ai-msg.bot{align-self:flex-start;background:#102c48;border:1px solid #244a69}
    .animee-ai-msg.user{align-self:flex-end;background:#07518a}
    .animee-ai-msg a{color:#91e6ff}
    #animee-ai-form{padding:11px;display:grid;grid-template-columns:1fr auto;gap:8px;border-top:1px solid #244262;background:#09172a}
    #animee-ai-input{min-width:0;resize:none;max-height:100px;min-height:42px;padding:10px;border-radius:10px;border:1px solid #34546e;background:#061321;color:white;font:inherit}
    #animee-ai-send{border:0;border-radius:10px;background:#1683c8;color:white;padding:0 13px;font-weight:800;cursor:pointer}
    #animee-ai-send:disabled{opacity:.55;cursor:wait}#animee-ai-note{padding:0 12px 8px;color:#9fb9ce;font-size:10px;background:#09172a}
    @media(max-width:480px){#animee-ai-launcher{right:12px;bottom:76px}#animee-ai-panel{right:8px;bottom:130px;width:calc(100vw - 16px);height:min(570px,calc(100dvh - 150px))}}
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "animee-ai-launcher";
  launcher.type = "button";
  launcher.textContent = "💬 Ask Animee AI";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "animee-ai-panel");
  const panel = document.createElement("section");
  panel.id = "animee-ai-panel";
  panel.setAttribute("aria-label", "Animee AI chat");
  panel.innerHTML = '<div id="animee-ai-head"><div><strong>✨ Animee AI</strong><small>Anime answers with live web search</small></div><button id="animee-ai-close" type="button" aria-label="Close chat">×</button></div><div id="animee-ai-log" role="log" aria-live="polite"></div><form id="animee-ai-form"><textarea id="animee-ai-input" rows="1" maxlength="3000" placeholder="Ask about anime, episodes, news…" required></textarea><button id="animee-ai-send" type="submit">Send</button></form><div id="animee-ai-note">AI can make mistakes. Verify important news with official sources.</div>';
  document.body.append(launcher, panel);

  const log = panel.querySelector("#animee-ai-log");
  const form = panel.querySelector("#animee-ai-form");
  const input = panel.querySelector("#animee-ai-input");
  const send = panel.querySelector("#animee-ai-send");
  const history = [];

  function addMessage(role, text) {
    const bubble = document.createElement("div");
    bubble.className = "animee-ai-msg " + (role === "user" ? "user" : "bot");
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }
  function openPanel(open) {
    panel.classList.toggle("open", open);
    launcher.setAttribute("aria-expanded", String(open));
    if (open && !log.childElementCount) addMessage("assistant", "Welcome to Animee! 💙 Ask me about anime titles, episode details, official announcements, upcoming releases, or trending anime.");
    if (open) input.focus();
  }
  launcher.addEventListener("click", () => openPanel(!panel.classList.contains("open")));
  panel.querySelector("#animee-ai-close").addEventListener("click", () => openPanel(false));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || send.disabled) return;
    addMessage("user", message);
    history.push({ role: "user", content: message });
    input.value = "";
    send.disabled = true;
    send.textContent = "…";
    const thinking = document.createElement("div");
    thinking.className = "animee-ai-msg bot";
    thinking.textContent = "Checking the latest information…";
    log.appendChild(thinking);
    log.scrollTop = log.scrollHeight;
    try {
      const response = await fetch(SUPABASE_URL + "/functions/v1/animee-ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLIC_KEY,
          "Authorization": "Bearer " + SUPABASE_PUBLIC_KEY
        },
        body: JSON.stringify({ messages: history.slice(-10) })
      });
      const data = await response.json().catch(() => ({}));
      thinking.remove();
      if (!response.ok) throw new Error(data.error || "The AI service is not ready yet.");
      const answer = data.answer || "I couldn't find an answer this time.";
      // Keep replies clean: do not automatically append a separate Sources list.
      // Relevant citations may still be included naturally in the answer when useful.
      addMessage("assistant", answer);
      history.push({ role: "assistant", content: answer });
      if (history.length > 10) history.splice(0, history.length - 10);
    } catch (error) {
      thinking.remove();
      addMessage("assistant", error.message || "Sorry, I couldn't connect. Please try again later.");
    } finally {
      send.disabled = false;
      send.textContent = "Send";
      input.focus();
    }
  });
})();
