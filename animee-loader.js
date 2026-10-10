/* Animee branded welcome screen. Always dismisses, even if other site features are slow. */
(() => {
  const loader = document.getElementById("animee-brand-loader");
  if (!loader) return;
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    loader.classList.add("is-hidden");
    window.setTimeout(() => loader.remove(), 400);
  };
  window.addEventListener("load", dismiss, { once: true });
  window.setTimeout(dismiss, 2200);
  if (document.readyState === "complete") dismiss();
})();
