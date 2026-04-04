# EduTech

EduTech is a static front-end school project with a Netlify Function that keeps the Groq API key off the public client. You can publish this repo publicly on GitHub as long as your real `.env` file is not committed.


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

Important: opening `index.html` directly is no longer the supported preview for AI features, because the chat and PC recommender now call the Netlify Function.

The login system in this project is a classroom demo only.
This is not secure authentication.

