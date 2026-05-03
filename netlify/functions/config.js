/* ============================================================
   netlify/functions/config.js
   Returns public client-side config from environment variables.
   Called by sentry-init.js and supabase-client.js on page load.

   Safe to expose: SUPABASE_ANON_KEY is a public anon key by
   design (row-level security enforced on the DB side).
   SENTRY_DSN is also non-sensitive (public DSN).

   ADMIN_USERNAME / ADMIN_PASSWORD are intentionally NOT
   included here — they are validated server-side only in
   netlify/functions/admin-login.js.
   ============================================================ */

exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      /* Allow any page origin to call this — it's read-only public config */
      "Access-Control-Allow-Origin": "*",
      /* Cache for 60 seconds to reduce function invocations */
      "Cache-Control": "public, max-age=60"
    },
    body: JSON.stringify({
      SUPABASE_URL:      process.env.SUPABASE_URL      || null,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || null,
      SENTRY_DSN:        process.env.SENTRY_DSN        || null
    })
  };
};
