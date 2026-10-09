(() => {
  const currentScript = document.currentScript;
  const base = currentScript ? new URL(".", currentScript.src) : new URL("./", location.href);
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(new URL("service-worker.js", base).href, { scope: base.pathname })
        .catch(error => console.warn("Animee offline support could not be enabled:", error));
    }, { once: true });
  }

  const style = document.createElement("style");
  style.textContent = `
    #animee-install-app{position:fixed;right:16px;bottom:16px;z-index:9998;border:1px solid #ffffff55;border-radius:999px;padding:12px 17px;background:linear-gradient(110deg,#146be0,#168ad6);color:#fff;font:800 14px/1.2 system-ui,sans-serif;box-shadow:0 8px 28px #0005;cursor:pointer;display:flex;align-items:center;gap:8px}
    #animee-install-app:focus-visible,#animee-install-close:focus-visible{outline:3px solid #87ceeb;outline-offset:3px}
    #animee-install-help{position:fixed;inset:0;z-index:9999;background:#020812cc;display:none;place-items:center;padding:20px}
    #animee-install-help .animee-install-card{width:min(440px,100%);background:#0c1b31;color:#f3f8ff;border:1px solid #65d9ff66;border-radius:20px;padding:24px;box-shadow:0 20px 70px #0008;font:16px/1.55 system-ui,sans-serif}
    #animee-install-help h2{margin:0 0 8px;font-size:24px}#animee-install-help p{color:#c1d4e9}#animee-install-close{border:0;border-radius:999px;padding:10px 16px;background:#1877f2;color:white;font-weight:800;cursor:pointer}
    @media(max-width:480px){#animee-install-app{right:12px;bottom:12px;padding:11px 14px;font-size:13px}}
    @media(display-mode:standalone){#animee-install-app{display:none!important}}
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "animee-install-app";
  button.type = "button";
  button.setAttribute("aria-label", "Install Animee on this device");
  button.innerHTML = '<span aria-hidden="true">⬇</span> Install Animee';
  document.body.appendChild(button);

  const help = document.createElement("div");
  help.id = "animee-install-help";
  help.setAttribute("role", "dialog");
  help.setAttribute("aria-modal", "true");
  help.setAttribute("aria-labelledby", "animee-install-title");
  help.innerHTML = '<div class="animee-install-card"><h2 id="animee-install-title">Install Animee 💙</h2><p>Keep Animee on your home screen for quick access to anime posts and the community.</p><p><strong>Android / Chrome:</strong> open the browser menu (⋮) and choose <em>Install app</em> or <em>Add to Home screen</em>.</p><p><strong>iPhone / iPad:</strong> open this page in Safari, tap <em>Share</em>, then choose <em>Add to Home Screen</em>.</p><button id="animee-install-close" type="button">Got it</button></div>';
  document.body.appendChild(help);
  const close = () => { help.style.display = "none"; button.focus(); };
  help.addEventListener("click", event => { if (event.target === help) close(); });
  help.querySelector("#animee-install-close").addEventListener("click", close);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && help.style.display === "grid") close(); });

  let installPrompt = null;
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (isStandalone()) button.hidden = true;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    button.innerHTML = '<span aria-hidden="true">⬇</span> Install Animee';
  });
  window.addEventListener("appinstalled", () => { installPrompt = null; button.hidden = true; });
  button.addEventListener("click", async () => {
    if (installPrompt) {
      installPrompt.prompt();
      try {
        const choice = await installPrompt.userChoice;
        if (choice && choice.outcome === "accepted") button.hidden = true;
      } catch (_) {}
      installPrompt = null;
    } else {
      help.style.display = "grid";
      help.querySelector("#animee-install-close").focus();
    }
  });
  // Shared Animee news component: the same feed is loaded on every site page and in the PWA.
  const newsScript = document.createElement("script");
  newsScript.src = new URL("anime-news.js", base).href;
  newsScript.defer = true;
  document.head.appendChild(newsScript);

  // Floating Animee AI assistant. The OpenAI key stays server-side in Supabase Edge Function secrets.
  if (!document.getElementById("animee-ai-chat")) {
    const chatStyle = document.createElement("style");
    chatStyle.textContent = `
      #animee-ai-launch{position:fixed;right:16px;bottom:78px;z-index:10000;border:1px solid #b7ecff;border-radius:999px;padding:12px 16px;background:linear-gradient(120deg,#07518a,#0786bd);color:#fff;font:800 14px/1.2 system-ui,sans-serif;box-shadow:0 8px 26px #06264255;cursor:pointer}
      #animee-ai-panel{position:fixed;right:16px;bottom:136px;z-index:10001;width:min(390px,calc(100vw - 24px));height:min(560px,calc(100dvh - 165px));display:none;flex-direction:column;overflow:hidden;border:1px solid #75ddff88;border-radius:18px;background:#071a2d;color:#f4f8ff;box-shadow:0 18px 55px #00101dcc;font:14px/1.45 system-ui,sans-serif}
      #animee-ai-panel.open{display:flex}
      #animee-ai-panel *{box-sizing:border-box}
      #animee-ai-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;background:linear-gradient(110deg,#0b3152,#07518a);border-bottom:1px solid #75ddff44}
      #animee-ai-head strong{font-size:15px}#animee-ai-head small{display:block;color:#c7eaff;font-size:11px}
      #animee-ai-close{border:0;background:#ffffff20;color:#fff;border-radius:50%;width:34px;height:34px;font-size:20px;cursor:pointer}
      #animee-ai-messages{flex:1;overflow:auto;padding:13px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}
      .animee-ai-msg{max-width:90%;padding:10px 12px;border-radius:13px;white-space:pre-wrap;overflow-wrap:anywhere}
      .animee-ai-msg.bot{align-self:flex-start;background:#102d49;border:1px solid #234968}
      .animee-ai-msg.user{align-self:flex-end;background:#07518a;border:1px solid #2b83b5}
      .animee-ai-msg a{color:#8fe5ff}
      #animee-ai-form{padding:10px;border-top:1px solid #75ddff33;background:#091f34}
      #animee-ai-form textarea{display:block;width:100%;resize:none;min-height:48px;max-height:110px;border:1px solid #315875;border-radius:12px;padding:10px;background:#061321;color:#fff;font:inherit}
      #animee-ai-form .row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}
      #animee-ai-form .hint{color:#9ebbd0;font-size:10px}
      #animee-ai-send{border:0;border-radius:999px;padding:9px 15px;background:#1685bd;color:#fff;font-weight:850;cursor:pointer}
      #animee-ai-send:disabled{opacity:.55;cursor:wait}
      #animee-ai-error{color:#ffb4bd;font-size:11px;margin-top:5px}
      @media(max-width:480px){#animee-ai-launch{right:12px;bottom:70px;padding:11px 13px}#animee-ai-panel{right:12px;bottom:126px;width:calc(100vw - 24px);height:min(560px,calc(100dvh - 150px))}}
      @media(display-mode:standalone){#animee-ai-launch{bottom:72px}}
      @media(prefers-reduced-motion:reduce){#animee-ai-launch{scroll-behavior:auto}}
    `;
    document.head.appendChild(chatStyle);

    const launch = document.createElement("button");
    launch.id = "animee-ai-launch";
    launch.type = "button";
    launch.textContent = "💬 Ask Animee AI";
    launch.setAttribute("aria-controls", "animee-ai-panel");
    launch.setAttribute("aria-expanded", "false");
    document.body.appendChild(launch);

    const panel = document.createElement("section");
    panel.id = "animee-ai-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Animee AI chat");
    panel.innerHTML = `
      <div id="animee-ai-head"><div><strong>✨ Animee AI Assistant</strong><small>Ask about anime or almost anything</small></div><button id="animee-ai-close" type="button" aria-label="Close chat">×</button></div>
      <div id="animee-ai-messages" aria-live="polite"><div class="animee-ai-msg bot">Hi! 👋 Welcome to Animee — Where Anime Comes to Life. Ask me about anime, episode details, recommendations, or general questions. I’ll do my best to help!</div></div>
      <form id="animee-ai-form"><textarea id="animee-ai-input" maxlength="2000" rows="2" aria-label="Your question" placeholder="Type your question…" required></textarea><div class="row"><span class="hint">AI can make mistakes. Verify important details.</span><button id="animee-ai-send" type="submit">Send ➤</button></div><div id="animee-ai-error" role="status"></div></form>
    `;
    document.body.appendChild(panel);

    const messages = panel.querySelector("#animee-ai-messages");
    const form = panel.querySelector("#animee-ai-form");
    const input = panel.querySelector("#animee-ai-input");
    const send = panel.querySelector("#animee-ai-send");
    const errorBox = panel.querySelector("#animee-ai-error");
    const history = [];
    const addMessage = (role, content) => {
      const item = document.createElement("div");
      item.className = "animee-ai-msg " + (role === "user" ? "user" : "bot");
      item.textContent = content;
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
      return item;
    };
    const toggleChat = open => {
      panel.classList.toggle("open", open);
      launch.setAttribute("aria-expanded", String(open));
      launch.textContent = open ? "✕ Close chat" : "💬 Ask Animee AI";
      if (open) input.focus();
    };
    launch.addEventListener("click", () => toggleChat(!panel.classList.contains("open")));
    panel.querySelector("#animee-ai-close").addEventListener("click", () => { toggleChat(false); launch.focus(); });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question || send.disabled) return;
      errorBox.textContent = "";
      addMessage("user", question);
      history.push({ role: "user", content: question });
      input.value = "";
      send.disabled = true;
      send.textContent = "Thinking…";
      const pending = addMessage("assistant", "Thinking…");
      try {
        const response = await fetch("https://mnfzpbwhvierboadwctz.supabase.co/functions/v1/animee-ai-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "sb_publishable_XV2dfLKtRHyIRcQBcwlaXA_QX61BvXW"
          },
          body: JSON.stringify({ messages: history.slice(-10) })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "The AI assistant is not configured yet.");
        const answer = typeof data.answer === "string" ? data.answer.trim() : "";
        if (!answer) throw new Error("I couldn't create an answer just now. Please try again.");
        pending.textContent = answer;
        if (Array.isArray(data.sources) && data.sources.length) {
          const sourceWrap = document.createElement("div");
          sourceWrap.style.cssText = "margin-top:9px;padding-top:8px;border-top:1px solid #315875;font-size:11px;display:grid;gap:5px";
          const sourceTitle = document.createElement("strong");
          sourceTitle.textContent = "Sources";
          sourceWrap.appendChild(sourceTitle);
          data.sources.slice(0, 8).forEach(source => {
            try {
              const url = new URL(source.url);
              if (!["https:", "http:"].includes(url.protocol)) return;
              const link = document.createElement("a");
              link.href = url.href;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              link.textContent = source.title || url.hostname;
              link.style.cssText = "color:#8fe5ff;overflow-wrap:anywhere";
              sourceWrap.appendChild(link);
            } catch (_) {}
          });
          if (sourceWrap.children.length > 1) pending.appendChild(sourceWrap);
        }
        history.push({ role: "assistant", content: answer });
      } catch (err) {
        pending.remove();
        history.pop();
        errorBox.textContent = err.message || "Could not connect to Animee AI. Please try again later.";
        addMessage("assistant", "Sorry, I couldn't answer that just now. Please try again in a moment.");
      } finally {
        send.disabled = false;
        send.textContent = "Send ➤";
        input.focus();
      }
    });
  }

})();
