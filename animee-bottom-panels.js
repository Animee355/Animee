/* Keep the requested announcements and trending panels together at the bottom of the Animee homepage. */
(() => {
  "use strict";
  const movePanels = () => {
    const footer = document.querySelector("footer.site-footer") || document.querySelector("footer");
    if (!footer || !footer.parentNode) return;
    let bottom = document.getElementById("animee-bottom-panels");
    if (!bottom) {
      bottom = document.createElement("div");
      bottom.id = "animee-bottom-panels";
      bottom.className = "page animee-bottom-panels";
      bottom.setAttribute("aria-label", "Animee news and trending panels");
      bottom.style.cssText = "max-width:1240px;margin:0 auto;padding:0 20px 24px;display:flex;flex-direction:column;gap:8px";
      footer.parentNode.insertBefore(bottom, footer);
    }
    const selectors = [
      "#animee-official-sources",
      "#animee-confirmed-tracker",
      "#animee-live-news",
      "#discover-trending",
      "#animee-trending"
    ];
    selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (!element) return;
      if (selector === "#discover-trending") {
        const section = element.closest(".discover-section") || element;
        if (section.parentElement !== bottom) {
          section.style.margin = "14px 0 18px";
          bottom.appendChild(section);
        }
      } else if (element.parentElement !== bottom) {
        element.style.width = "100%";
        element.style.maxWidth = "none";
        element.style.margin = "14px 0 18px";
        bottom.appendChild(element);
      }
    });
  };
  const start = () => {
    movePanels();
    const observer = new MutationObserver(() => movePanels());
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();