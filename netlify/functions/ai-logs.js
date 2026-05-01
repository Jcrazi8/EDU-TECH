"use strict";

const { getAuditStore, formatStoreError } = require("./ai-log-store");

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  };
}

async function listConversationLogs(store, limit) {
  const listing = await store.list({ prefix: "chat/" });
  const blobs = Array.isArray(listing && listing.blobs) ? listing.blobs : [];

  const keys = blobs
    .map(blob => blob && blob.key)
    .filter(Boolean)
    .sort((a, b) => String(b).localeCompare(String(a)))
    .slice(0, limit);

  const records = await Promise.all(
    keys.map(async key => {
      try {
        return await store.get(key, { type: "json" });
      } catch {
        return null;
      }
    })
  );

  return records.filter(Boolean);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }

  let store;
  try {
    store = getAuditStore();
  } catch (error) {
    return json(503, {
      error: `AI moderation storage is unavailable: ${formatStoreError(error)}`
    });
  }

  if (event.httpMethod === "GET") {
    const rawLimit = event.queryStringParameters && event.queryStringParameters.limit;
    const limit = Math.min(Math.max(parseInt(rawLimit || "100", 10) || 100, 1), 200);

    try {
      const logs = await listConversationLogs(store, limit);
      return json(200, { logs });
    } catch {
      return json(500, { error: "Unable to load AI conversation logs right now." });
    }
  }

  if (event.httpMethod === "DELETE") {
    try {
      const listing = await store.list({ prefix: "chat/" });
      const blobs = Array.isArray(listing && listing.blobs) ? listing.blobs : [];

      await Promise.all(
        blobs
          .map(blob => blob && blob.key)
          .filter(Boolean)
          .map(key => store.delete(key))
      );

      return json(200, { cleared: blobs.length });
    } catch {
      return json(500, { error: "Unable to clear AI conversation logs right now." });
    }
  }

  return json(405, { error: "Method not allowed." });
};
