"use strict";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_CONTEXT = [
  "You are EduTech AI, a helpful assistant for a virtual tech support company called EduTech.",
  "EduTech provides free remote IT support, hardware repair services, IT certification programs for students,",
  "and tech support for elderly users.",
  "Be friendly, concise, and helpful. Keep responses under 3 sentences."
].join(" ");

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  };
}

function buildChatRequest(message) {
  if (!message || !String(message).trim()) {
    return { error: "Please enter a message before sending." };
  }

  return {
    messages: [
      { role: "system", content: SYSTEM_CONTEXT },
      { role: "user", content: String(message).trim() }
    ],
    max_tokens: 300
  };
}

function buildPcRequest(body) {
  const budget = body.budget;
  const usecase = body.usecase || "general use";
  const level = body.level || "beginner";

  if (!budget || Number(budget) < 200) {
    return { error: "Please enter a budget of at least $200." };
  }

  const prompt = [
    "You are a PC hardware expert. Recommend a PC build for:",
    `- Budget: $${budget}`,
    `- Use case: ${usecase}`,
    `- Experience level: ${level}`,
    "List 5 key components (CPU, GPU, RAM, Storage, Motherboard) with specific part names.",
    "Keep it brief and practical."
  ].join("\n");

  return {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  if (!process.env.GROQ_API_KEY) {
    return json(500, {
      error: "Server is missing GROQ_API_KEY. Add it to your local .env or Netlify environment variables."
    });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON request body." });
  }

  let requestConfig;
  if (body.type === "chat") {
    requestConfig = buildChatRequest(body.message);
  } else if (body.type === "pc-build") {
    requestConfig = buildPcRequest(body);
  } else {
    return json(400, { error: "Unsupported AI request type." });
  }

  if (requestConfig.error) {
    return json(400, { error: requestConfig.error });
  }

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages: requestConfig.messages,
        max_tokens: requestConfig.max_tokens
      })
    });

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      return json(groqResponse.status, {
        error: data && data.error && data.error.message
          ? data.error.message
          : "The AI provider returned an error."
      });
    }

    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";

    if (!reply || !String(reply).trim()) {
      return json(502, { error: "The AI provider returned an empty response." });
    }

    return json(200, { reply: String(reply).trim() });
  } catch {
    return json(500, {
      error: "Unable to reach the AI service right now. If you are running locally, start the site with netlify dev."
    });
  }
};
