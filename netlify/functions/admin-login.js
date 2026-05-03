/* ============================================================
   netlify/functions/admin-login.js
   Validates admin credentials against Netlify environment
   variables (ADMIN_USERNAME, ADMIN_PASSWORD).

   Returns:
     200 { success: true,  displayName: 'Admin' }
     200 { success: false }
     503 { error: 'Admin credentials not configured.' }
       (triggers client-side fallback to local auth)
   ============================================================ */

exports.handler = async function (event) {
  /* Only allow POST */
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  /* If env vars are not set, return 503 so the client falls back to local auth */
  if (!adminUsername || !adminPassword) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Admin credentials not configured." })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body." })
    };
  }

  const { username, password } = body;

  if (
    typeof username === "string" &&
    typeof password === "string" &&
    username.toLowerCase() === adminUsername.toLowerCase() &&
    password === adminPassword
  ) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, displayName: "Admin" })
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success: false })
  };
};
