# EduTech — Admin Panel Fix Setup

This patch fixes the issue where messages from the contact, support, subscription, and certification forms never reached your admin panel. It also adds **email receipts** so you (the admin) and the visitor each get a copy of every submission.

---

## What was wrong

The old `auth.js` saved every submission to **`localStorage`**, which is **per-device**. A visitor's contact form on their phone never reached your admin panel because each browser has its own private storage.

## What this patch changes

| File | Change |
|------|--------|
| `netlify/functions/activity.js` | **NEW** — server-side endpoint. POST=log event, GET=list, DELETE=clear. Sends two emails on every POST (admin copy + visitor receipt). |
| `netlify/functions/activity-log-store.js` | **NEW** — Netlify Blobs helper, mirrors `ai-log-store.js`. |
| `auth.js` | `logActivity()` now POSTs to the function. `getActivityLog()` is now async and reads from the server. New `clearActivityLog()` calls DELETE. |
| `admin.html` | `refreshData()` awaits the new async `getActivityLog()`. `clearActivity()` now hits the server. New "Certification" filter button. |
| `main.js` | Contact form now sends `email`, `subject`, full `message`. Auto-detects certification requests so they appear in the certification filter. |
| `dashboard.html` | Support form & subscription button now include the signed-in user's email so they get a receipt. |
| `package.json` | No new deps required — uses native `fetch` for Resend. |

Files are drop-in replacements. Copy them over your existing files.

---

## Files to copy into your repo

```
auth.js                                  → replace
admin.html                               → replace
main.js                                  → replace
dashboard.html                           → replace
netlify/functions/activity.js            → NEW
netlify/functions/activity-log-store.js  → NEW
```

`ai.js`, `ai-logs.js`, `ai-log-store.js`, `style.css`, `services.html`, `index.html`, `contact.html`, `certify.html`, etc. — **leave untouched**.

---

## Required: configure Resend (free, 3,000 emails/month)

1. Sign up at [resend.com](https://resend.com) — free, no credit card.
2. Click **API Keys** → **Create API Key** → copy it.
3. (Optional but recommended) Click **Domains** → **Add Domain** → enter your domain → add the DNS records Resend gives you. Until you do this, you can use the default sender `onboarding@resend.dev`, which works fine for testing but will land in spam in production.

## Required: add 3 environment variables in Netlify

Netlify dashboard → your site → **Site configuration** → **Environment variables** → **Add a variable**.

| Key | Value | Required? |
|-----|-------|-----------|
| `RESEND_API_KEY` | `re_...` from Resend | **Yes** — emails won't send without it |
| `ADMIN_EMAIL` | The email **you** want admin copies sent to | **Yes** — admin email won't send without it |
| `MAIL_FROM` | e.g. `EduTech <noreply@yourdomain.com>` once you verify your domain. Leave unset to use the default `EduTech <onboarding@resend.dev>` for testing. | Optional |

After adding them, **redeploy** the site (Netlify → Deploys → Trigger deploy → Clear cache and deploy site).

> If you don't add `RESEND_API_KEY`, **the activity feed still works** — submissions will just be saved to the admin panel without sending emails. The function will not crash.

---

## Testing locally with `netlify dev`

Create a `.env` file in the project root (already gitignored):

```
GROQ_API_KEY=your-groq-key
RESEND_API_KEY=re_your_resend_key
ADMIN_EMAIL=your-real-email@gmail.com
```

Then run:

```bash
netlify dev
```

Open `http://localhost:8888`, submit the contact form with your own email address as the visitor email. You should get **two** emails (one to your admin email, one to your visitor email — they'll be the same inbox if you use the same address).

---

## Quick sanity check

After deploying, open your live site and:

1. Submit the contact form on `contact.html` with a real email address.
2. Open `admin.html` (log in as Admin) → Activity panel → you should see the new entry with the full message body.
3. Check both inboxes — you should have an admin notification and a visitor receipt.

If something's missing, open the browser **DevTools → Network tab** and filter for `activity`. Look at the response from `/.netlify/functions/activity`:

- `200` with `{"ok": true, ...}` → activity saved. Check the `emails` field for any per-email errors (e.g. "ADMIN_EMAIL not set" or a Resend error message).
- `503` → Netlify Blobs not available. Make sure you're running on Netlify or via `netlify dev`.
- Network error → the function isn't deployed; redeploy.
