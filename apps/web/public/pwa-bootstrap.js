(function () {
  window.__pwaState = window.__pwaState || { deferredPrompt: null };

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__pwaState.deferredPrompt = e;
    window.dispatchEvent(new Event("pwa:prompt-available"));
  });

  window.addEventListener("appinstalled", function () {
    try {
      localStorage.setItem("app_pwa_installed", "1");
    } catch {
      /* ignore storage errors (e.g. private browsing) */
    }
    window.__pwaState.deferredPrompt = null;
    window.dispatchEvent(new Event("app:pwa-installed"));
  });
})();
