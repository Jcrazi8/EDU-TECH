/* sentry-init.js — also bootstraps window.EDUTECH_CONFIG
   Fetches /api/config (Netlify function) for SUPABASE_URL,
   SUPABASE_ANON_KEY, SENTRY_DSN, then loads Sentry only if a
   DSN is set. Safe to include on every page. */

(function () {
  window.EDUTECH_CONFIG = window.EDUTECH_CONFIG || {};

  fetch("/.netlify/functions/config", { cache: "no-store" })
    .then(r => r.ok ? r.json() : {})
    .then(cfg => {
      window.EDUTECH_CONFIG = Object.assign(window.EDUTECH_CONFIG, cfg || {});
      window.dispatchEvent(new CustomEvent("edutech-config-loaded"));

      const dsn = window.EDUTECH_CONFIG.SENTRY_DSN;
      if (!dsn) return;
      const s = document.createElement("script");
      s.src = "https://browser.sentry-cdn.com/7.110.0/bundle.min.js";
      s.crossOrigin = "anonymous";
      s.onload = () => {
        if (window.Sentry) {
          window.Sentry.init({
            dsn,
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0
          });
        }
      };
      document.head.appendChild(s);
    })
    .catch(() => {/* config endpoint not deployed yet */});
})();
