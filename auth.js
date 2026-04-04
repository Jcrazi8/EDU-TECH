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
    username:    "user1",
    password:    "EduUser2026!",
    role:        "user",
    displayName: "Alex Johnson",
    email:       "alex@example.com",
    plan:        "Basic (Free)",
    joined:      "March 2026"
  }
];

const DEFAULT_ADMINS = [
  {
    username:    "admin",
    password:    "EduAdmin2026!",
    role:        "admin",
    displayName: "Admin - EduTech",
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

function getSession() { const r = sessionStorage.getItem("edutech_user"); return r ? JSON.parse(r) : null; }

function requireAuth(requiredRole) {
  const session = getSession();
  if (!session) { window.location.href = "login.html"; return null; }
  if (requiredRole && session.role !== requiredRole) {
    window.location.href = session.role === "admin" ? "admin.html" : "dashboard.html";
    return null;
  }
  return session;
}

function logout() { sessionStorage.removeItem("edutech_user"); window.location.href = "index.html"; }

function getActivityLog() { const r = localStorage.getItem("edutech_activity"); return r ? JSON.parse(r) : []; }

function logActivity(type, data) {
  const log = getActivityLog();
  log.unshift({ id: Date.now(), type, timestamp: new Date().toLocaleString(), ...data });
  localStorage.setItem("edutech_activity", JSON.stringify(log.slice(0, 100)));
}
