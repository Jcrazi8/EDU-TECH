# EduTech

EduTech is a static front-end school project with a Netlify Function that keeps the Groq API key off the public client. You can publish this repo publicly on GitHub as long as your real `.env` file is not committed.

## Before You Push Publicly

1. Revoke the old leaked Groq key.
2. Generate a new Groq API key.
3. Keep the new key only in `.env` locally and in Netlify environment variables when deployed.
4. Do not commit `.env`.

## Project Structure

| File | Purpose |
|------|---------|
| `index.html` and other `.html` files | Static pages for the EduTech site |
| `style.css` | Shared site styling |
| `founder.css` | Founders page styling |
| `main.js` | Front-end interactions, chat widget, forms, calculators |
| `auth.js` | Browser-only demo login and activity storage |
| `netlify/functions/ai.js` | Serverless proxy for Groq requests |
| `netlify.toml` | Netlify build and functions config |
| `.env.example` | Safe template for local secrets |
| `CREDENTIALS.txt` | Public demo login info only |

## Local Setup

1. Install the Netlify CLI if you do not already have it.
   Example: `npm install -g netlify-cli`
2. Copy `.env.example` to `.env`.
3. Open `.env` and replace `replace-with-new-groq-api-key` with your new Groq key.
4. Start the project with `netlify dev` from this folder.
5. Open the local URL shown by Netlify.

Important: opening `index.html` directly is no longer the supported preview for AI features, because the chat and PC recommender now call the Netlify Function.

## Netlify Deployment

1. Push this folder to a GitHub repository.
2. Create a new Netlify site connected to that GitHub repo.
3. In Netlify site settings, add these environment variables:
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (optional, defaults to `llama-3.3-70b-versatile`)
4. Deploy the site.

Netlify will publish the static pages and serve the AI endpoint at `/.netlify/functions/ai`.

## GitHub Quick Start

If this folder is not already a git repo, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

Because `.env` is ignored in `.gitignore`, your real API key will not be included in the push.

## Demo Login

The login system in this project is a classroom demo only.

- Accounts are stored in `localStorage` on the current browser.
- This is not secure authentication.
- Public demo accounts are listed in `CREDENTIALS.txt`.
- You can change them in `admin.html` under `Demo Credentials` or directly in `auth.js`.

## AI Request Formats

Frontend calls:

- Chat: `POST /.netlify/functions/ai` with `{ "type": "chat", "message": "..." }`
- PC recommender: `POST /.netlify/functions/ai` with `{ "type": "pc-build", "budget": 1200, "usecase": "gaming", "level": "intermediate" }`

Successful responses return:

```json
{ "reply": "..." }
```

Error responses return:

```json
{ "error": "..." }
```

## What You Still Need To Do

- Put your newly generated Groq key into `.env`.
- If you deploy to Netlify, add the same key to Netlify environment variables.
- If you already created a git repo that contains the leaked key in its history, clean that history or start with a fresh repo before pushing public.
