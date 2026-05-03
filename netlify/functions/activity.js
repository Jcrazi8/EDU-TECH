"use strict";

/* ============================================================
   activity.js — EduTech activity feed function
   ------------------------------------------------------------
   POST   /.netlify/functions/activity   → log a new event
   GET    /.netlify/functions/activity   → list events (admin)
   DELETE /.netlify/functions/activity   → clear all events

   On every successful POST it also sends two emails via Resend:
     1. Admin copy           → ADMIN_EMAIL
     2. Visitor receipt      → the email the visitor entered
   Both emails are best-effort: if Resend is not configured or the
   request fails, we still save the activity so the admin panel
   keeps working.
   ============================================================ */

const { getActivityStore, formatStoreError } = require("./activity-log-store");

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
};

const ALLOWED_TYPES = new Set([
  "contact_form",
  "support_request",
  "subscription_attempt",
  "certification_request"
]);

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function clean(value, max = 500) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizePayload(body, event) {
  const type = clean(body.type, 40);
  if (!ALLOWED_TYPES.has(type)) return { error: "Unsupported activity type." };

  const forwarded = event && event.headers
    ? event.headers["x-forwarded-for"] || event.headers["X-Forwarded-For"] || ""
    : "";
  const ipHint = String(forwarded).split(",")[0].trim();

  return {
    entry: {
      type,
      name:    clean(body.name, 120),
      email:   clean(body.email, 160),
      user:    clean(body.user, 120),
      page:    clean(body.page, 160),
      subject: clean(body.subject, 160),
      message: clean(body.message, 4000),
      details: clean(body.details, 600),
      ipHint
    }
  };
}

/* ------------------------------------------------------------
   Email helpers (Resend)
   ------------------------------------------------------------ */

function emailConfig() {
  return {
    apiKey:     process.env.RESEND_API_KEY    || "",
    fromEmail:  process.env.MAIL_FROM         || "EduTech <onboarding@resend.dev>",
    adminEmail: process.env.ADMIN_EMAIL       || ""
  };
}

async function sendEmail({ apiKey, fromEmail, to, subject, html }) {
  if (!apiKey || !to) return { ok: false, skipped: true };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { ok: false, error: (data && data.message) || `Resend ${response.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Email send failed." };
  }
}

const TYPE_LABEL = {
  contact_form:           "Contact Form Submission",
  support_request:        "Tech Support Request",
  subscription_attempt:   "Subscription Inquiry",
  certification_request:  "Certification Request"
};

function buildAdminEmail(entry) {
  const label = TYPE_LABEL[entry.type] || "New Activity";
  return {
    subject: `[EduTech] New ${label} from ${entry.name || entry.email || "a visitor"}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0e1116;">
        <h2 style="color:#00b3c4;margin:0 0 8px;">New ${escapeHtml(label)}</h2>
        <p style="color:#555;margin:0 0 20px;">A visitor just submitted a request on EduTech.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#888;width:120px;">Name</td><td><strong>${escapeHtml(entry.name || "—")}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#888;">Email</td><td>${escapeHtml(entry.email || "—")}</td></tr>
          <tr><td style="padding:6px 0;color:#888;">Page</td><td>${escapeHtml(entry.page || "—")}</td></tr>
          ${entry.subject ? `<tr><td style="padding:6px 0;color:#888;">Subject</td><td>${escapeHtml(entry.subject)}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#888;">IP hint</td><td>${escapeHtml(entry.ipHint || "—")}</td></tr>
        </table>

        ${entry.message ? `
          <h3 style="margin:24px 0 8px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Message</h3>
          <div style="background:#f5f7fa;border-left:3px solid #00b3c4;padding:12px 14px;border-radius:6px;white-space:pre-wrap;">${escapeHtml(entry.message)}</div>
        ` : ""}

        ${entry.details ? `<p style="color:#666;font-size:13px;margin-top:18px;"><strong>Details:</strong> ${escapeHtml(entry.details)}</p>` : ""}
        <p style="color:#999;font-size:12px;margin-top:28px;">Open the admin panel to manage this request.</p>
      </div>`
  };
}

function buildVisitorEmail(entry) {
  const label = TYPE_LABEL[entry.type] || "your request";
  const friendly = {
    contact_form:           "Thanks for reaching out to EduTech! We've received your message and a team member will get back to you within 1 business day.",
    support_request:        "Thanks for submitting a support request! Our certified IT team has been notified and will respond as soon as a technician is available.",
    subscription_attempt:   "Thanks for your interest in subscribing! We'll follow up shortly with the next steps to activate your subscriber benefits.",
    certification_request:  "Thanks for your interest in EduTech certification! A program coordinator will email you with application details soon."
  }[entry.type] || "Thanks for contacting EduTech! We've received your request and will follow up shortly.";

  return {
    subject: `We received your ${label.toLowerCase()} — EduTech`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0e1116;">
        <div style="text-align:center;padding:24px 0;border-bottom:1px solid #eee;">
          <h1 style="margin:0;font-size:22px;color:#00b3c4;">EduTech</h1>
        </div>

        <h2 style="margin:24px 0 8px;font-size:20px;">Hi ${escapeHtml(entry.name ? entry.name.split(" ")[0] : "there")} 👋</h2>
        <p style="font-size:15px;line-height:1.6;color:#333;">${escapeHtml(friendly)}</p>

        <h3 style="margin:28px 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Your submission</h3>
        <div style="background:#f5f7fa;border-radius:8px;padding:14px 16px;font-size:14px;">
          ${entry.subject ? `<p style="margin:0 0 8px;"><strong>Subject:</strong> ${escapeHtml(entry.subject)}</p>` : ""}
          ${entry.message ? `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(entry.message)}</p>` : `<p style="margin:0;color:#888;">${escapeHtml(entry.details || "Submission received.")}</p>`}
        </div>

        <p style="font-size:13px;color:#888;margin-top:24px;">If you didn't submit this request, you can safely ignore this email.</p>
        <p style="font-size:12px;color:#aaa;margin-top:32px;text-align:center;">© 2026 EduTech · Accessible, affordable technology support.</p>
      </div>`
  };
}

async function sendActivityEmails(entry) {
  const cfg = emailConfig();
  if (!cfg.apiKey) {
    return { admin: { skipped: true }, visitor: { skipped: true }, reason: "RESEND_API_KEY not configured." };
  }

  const tasks = [];

  if (cfg.adminEmail) {
    const adminMail = buildAdminEmail(entry);
    tasks.push(sendEmail({ apiKey: cfg.apiKey, fromEmail: cfg.fromEmail, to: cfg.adminEmail, subject: adminMail.subject, html: adminMail.html }).then(r => ["admin", r]));
  } else {
    tasks.push(Promise.resolve(["admin", { skipped: true, reason: "ADMIN_EMAIL not set" }]));
  }

  if (entry.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
    const visitorMail = buildVisitorEmail(entry);
    tasks.push(sendEmail({ apiKey: cfg.apiKey, fromEmail: cfg.fromEmail, to: entry.email, subject: visitorMail.subject, html: visitorMail.html }).then(r => ["visitor", r]));
  } else {
    tasks.push(Promise.resolve(["visitor", { skipped: true, reason: "no visitor email" }]));
  }

  const results = await Promise.all(tasks);
  return Object.fromEntries(results);
}

/* ------------------------------------------------------------
   Handler
   ------------------------------------------------------------ */

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }

  let store;
  try {
    store = getActivityStore();
  } catch (error) {
    return json(503, { error: `Activity storage is unavailable: ${formatStoreError(error)}` });
  }

  /* ---------- POST: log a new activity event ---------- */
  if (event.httpMethod === "POST") {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return json(400, { error: "Invalid JSON request body." }); }

    const result = sanitizePayload(body, event);
    if (result.error) return json(400, { error: result.error });

    const now = new Date();
    const id  = `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      id,
      createdAt: now.toISOString(),
      timestamp: now.toLocaleString(),
      ...result.entry
    };

    const key = `events/${now.getTime()}-${Math.random().toString(36).slice(2, 10)}.json`;
    try {
      await store.setJSON(key, entry);
    } catch (error) {
      return json(500, { error: `Could not save activity: ${formatStoreError(error)}` });
    }

    /* Email is best-effort — never block the visitor on it. */
    let emailStatus = { skipped: true, reason: "not attempted" };
    try { emailStatus = await sendActivityEmails(entry); }
    catch (err) { emailStatus = { error: err.message || "Email send failed." }; }

    return json(200, { ok: true, entry, emails: emailStatus });
  }

  /* ---------- GET: list events for the admin panel ---------- */
  if (event.httpMethod === "GET") {
    const rawLimit = event.queryStringParameters && event.queryStringParameters.limit;
    const limit = Math.min(Math.max(parseInt(rawLimit || "100", 10) || 100, 1), 500);

    try {
      const listing = await store.list({ prefix: "events/" });
      const blobs = Array.isArray(listing && listing.blobs) ? listing.blobs : [];
      const keys = blobs
        .map(b => b && b.key)
        .filter(Boolean)
        .sort((a, b) => String(b).localeCompare(String(a)))
        .slice(0, limit);

      const records = await Promise.all(
        keys.map(async key => {
          try { return await store.get(key, { type: "json" }); }
          catch { return null; }
        })
      );

      return json(200, { events: records.filter(Boolean) });
    } catch {
      return json(500, { error: "Unable to load activity logs right now." });
    }
  }

  /* ---------- DELETE: clear all events ---------- */
  if (event.httpMethod === "DELETE") {
    try {
      const listing = await store.list({ prefix: "events/" });
      const blobs = Array.isArray(listing && listing.blobs) ? listing.blobs : [];
      await Promise.all(
        blobs.map(b => b && b.key).filter(Boolean).map(key => store.delete(key))
      );
      return json(200, { cleared: blobs.length });
    } catch {
      return json(500, { error: "Unable to clear activity logs right now." });
    }
  }

  return json(405, { error: "Method not allowed." });
};
