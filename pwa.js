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
})();
