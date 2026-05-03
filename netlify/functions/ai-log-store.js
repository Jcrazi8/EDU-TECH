"use strict";

const AI_LOG_STORE = "ai-moderation";

function buildStoreOptions() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || "";
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || "";
  const options = {};

  if (siteID) options.siteID = siteID;
  if (token) options.token = token;

  return Object.keys(options).length ? options : undefined;
}

function getAuditStore() {
  const { getStore } = require("@netlify/blobs");
  return getStore(AI_LOG_STORE, buildStoreOptions());
}

function formatStoreError(error) {
  if (!error) return "Unknown storage error.";
  const message = error && error.message ? String(error.message) : String(error);
  return message.replace(/\s+/g, " ").trim();
}

module.exports = {
  getAuditStore,
  formatStoreError,
  AI_LOG_STORE
};
