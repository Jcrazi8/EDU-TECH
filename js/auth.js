/* ============================================================
   auth.js - EduTech demo authentication store
   ============================================================
   This is a classroom demo only. Credentials live in browser
   storage and are not real authentication.
   HOW TO CHANGE PASSWORDS / USERNAMES:
   - Edit the DEFAULT_USERS or DEFAULT_ADMINS arrays below,
     OR use the Admin Panel which saves changes to localStorage.
   - Admin Panel changes always override these defaults.
   ============================================================ */

const DEFAULT_USERS = [
  {
    username:    "hsct1",
    password:    "edutech2026",
    role:        "user",
    displayName: "Highschool",
    email:       "hsct@example.com",
    plan:        "Basic (Free)",
    joined:      "March 2026"
  }
];

const DEFAULT_ADMINS = [
  {
    username:    "Admin",
    password:    "E022808j",
    role:        "admin",
    displayName: "EJ Admin",
    email:       "admin@edutech.io"
  }
];

function getUsers()   { const s = localStorage.getItem("edutech_users");  return s ? JSON.parse(s) : DEFAULT_USERS; }
function getAdmins()  { const s = localStorage.getItem("edutech_admins"); return s ? JSON.parse(s) : DEFAULT_ADMINS; }
function saveUsers(u)  { localStorage.setItem("edutech_users",  JSON.stringify(u)); }
function saveAdmins(a) { localStorage.setItem("edutech_admins", JSON.stringify(a)); }

function authenticate(username, password, role) {
  const list  = role === "admin" ? getAdmins() : getUsers();
  const match = list.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  return match ? { success: true, username: match.username, role: match.role, displayName: match.displayName } : { success: false };
}

/* ------------------------------------------------------------
   USER SELF-REGISTRATION
   ------------------------------------------------------------
   Lets visitors create their own account WITHOUT touching the
   code or the admin panel. New accounts are saved to the same
   localStorage list that the login form already reads.
   The new account is also POSTed to the activity log so the
   admin can see who signed up + (if Resend is configured) get
   a notification email.
   ------------------------------------------------------------ */
function registerUser({ username, password, displayName, email }) {
  const u = (username || "").trim();
  const p = (password || "");
  const d = (displayName || "").trim();
  const e = (email || "").trim();

  if (!u || !p) return { success: false, error: "Username and password are required." };
  if (u.length < 3) return { success: false, error: "Username must be at least 3 characters." };
  if (p.length < 6) return { success: false, error: "Password must be at least 6 characters." };
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { success: false, error: "Email looks invalid." };

  const users  = getUsers();
  const admins = getAdmins();
  const taken  = [...users, ...admins].some(x => x.username.toLowerCase() === u.toLowerCase());
  if (taken) return { success: false, error: "That username is already taken." };

  const newUser = {
    username:    u,
    password:    p,
    role:        "user",
    displayName: d || u,
    email:       e || "",
    plan:        "Basic (Free)",
    joined:      new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
  };
  users.push(newUser);
  saveUsers(users);

  // Notify the admin / activity log (best-effort; safe if offline)
  try {
    if (typeof logActivity === "function") {
      logActivity("signup", { username: u, displayName: newUser.displayName, email: e });
    }
  } catch (_) { /* ignore */ }

  return { success: true, user: newUser };
}

function getSession() { const r = sessionStorage.getItem("edutech_user"); return r ? JSON.parse(r) : null; }

/* ------------------------------------------------------------
   Path helper
   The site is now organized into folders:
     /index.html              <- homepage at root
     /pages/*.html            <- every other page
   This helper builds correct URLs whether the script is running
   from the root (index.html) or from inside the pages/ folder.
   ------------------------------------------------------------ */
function edutechUrl(target) {
  // target should be one of: 'index.html', 'login.html', 'admin.html',
  // 'dashboard.html', etc. (no leading slash)
  const inPagesFolder = window.location.pathname.includes('/pages/');
  if (target === 'index.html') return inPagesFolder ? '../index.html' : 'index.html';
  return inPagesFolder ? target : 'pages/' + target;
}

function requireAuth(requiredRole) {
  const session = getSession();
  if (!session) { window.location.href = edutechUrl('login.html'); return null; }
  if (requiredRole && session.role !== requiredRole) {
    window.location.href = edutechUrl(session.role === "admin" ? "admin.html" : "dashboard.html");
    return null;
  }
  return session;
}

function logout() { sessionStorage.removeItem("edutech_user"); window.location.href = edutechUrl("index.html"); }

/* ============================================================
   ACTIVITY FEED — server-backed
   ------------------------------------------------------------
   Every contact form, support request, subscription attempt,
   and certification request is POSTed to the Netlify Function
   at /.netlify/functions/activity. The admin panel reads from
   the same endpoint so the data is shared across all browsers.
   ============================================================ */

const ACTIVITY_ENDPOINT = "/.netlify/functions/activity";

/* logActivity is now async — pages can `await` it before showing
   their success message, but old call sites that don't await it
   still work because we fire-and-forget the network request.   */
function logActivity(type, data) {
  const payload = Object.assign({ type, page: location.pathname || "" }, data || {});

  return fetch(ACTIVITY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn("[EduTech] Activity log failed:", body.error || response.statusText);
        return { ok: false, error: body.error || "Activity log failed." };
      }
      return { ok: true, entry: body.entry, emails: body.emails };
    })
    .catch(err => {
      console.warn("[EduTech] Could not reach activity endpoint:", err.message);
      return { ok: false, error: err.message };
    });
}

/* The admin panel calls this — it now fetches from the server
   instead of localStorage. Returns a promise that resolves to
   an array of entries (newest first).                          */
async function getActivityLog() {
  try {
    const response = await fetch(`${ACTIVITY_ENDPOINT}?limit=200`, {
      headers: { "Cache-Control": "no-store" }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.warn("[EduTech] getActivityLog failed:", data.error || response.statusText);
      return [];
    }
    return Array.isArray(data.events) ? data.events : [];
  } catch (err) {
    console.warn("[EduTech] getActivityLog error:", err.message);
    return [];
  }
}

/* DELETE the entire feed. Used by the admin panel "Clear All"
   button. Returns the number of entries cleared.               */
async function clearActivityLog() {
  try {
    const response = await fetch(ACTIVITY_ENDPOINT, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Clear failed.");
    return data.cleared || 0;
  } catch (err) {
    console.warn("[EduTech] clearActivityLog error:", err.message);
    throw err;
  }
}
