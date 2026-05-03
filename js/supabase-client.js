/* supabase-client.js — Supabase wrapper with graceful fallback.
   Loads SDK from CDN only if SUPABASE_URL + SUPABASE_ANON_KEY are
   in window.EDUTECH_CONFIG (populated by sentry-init.js). All helper
   functions resolve to null/[] if Supabase isn't configured.       */

(function () {
  window.edutechSupabase = null;

  function tryInit() {
    const cfg = window.EDUTECH_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
    if (window.supabase) {
      window.edutechSupabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      window.dispatchEvent(new CustomEvent("edutech-supabase-ready"));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    s.onload = () => {
      window.edutechSupabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      window.dispatchEvent(new CustomEvent("edutech-supabase-ready"));
    };
    document.head.appendChild(s);
  }

  if (window.EDUTECH_CONFIG && window.EDUTECH_CONFIG.SUPABASE_URL) {
    tryInit();
  } else {
    window.addEventListener("edutech-config-loaded", tryInit);
  }

  /* ---- Helpers ---- */

  window.submitContact = async function (data) {
    const sb = window.edutechSupabase;
    if (sb) {
      const { error } = await sb.from("contacts").insert([data]);
      if (error) throw error;
      return { ok: true, source: "supabase" };
    }
    // Fallback to existing activity-log endpoint
    const r = await fetch("/.netlify/functions/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ type: "contact" }, data))
    });
    if (!r.ok) throw new Error("Activity endpoint failed");
    return { ok: true, source: "activity-log" };
  };

  window.submitCertification = async function (data) {
    const sb = window.edutechSupabase;
    if (sb) {
      const { error } = await sb.from("certifications").insert([data]);
      if (error) throw error;
      return { ok: true, source: "supabase" };
    }
    const r = await fetch("/.netlify/functions/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ type: "certification" }, data))
    });
    if (!r.ok) throw new Error("Activity endpoint failed");
    return { ok: true, source: "activity-log" };
  };

  window.getContacts = async function () {
    const sb = window.edutechSupabase;
    if (!sb) return null; // signals to caller: use the activity log instead
    const { data, error } = await sb.from("contacts").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data;
  };

  window.getCertifications = async function () {
    const sb = window.edutechSupabase;
    if (!sb) return null;
    const { data, error } = await sb.from("certifications").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data;
  };
})();
