"use strict";

/* ============================================================
   activity-log-store.js
   ------------------------------------------------------------
   Thin wrapper around Netlify Blobs for the EduTech activity
   feed (contact form submissions, support requests, subscription
   attempts, certification requests, etc.). Mirrors the pattern
   used by ai-log-store.js so both stores work the same way both
   in production and under `netlify dev`.
   ============================================================ */

const ACTIVITY_STORE = "edutech-activity";

function buildStoreOptions() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID || "";
  const token  = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || "";
  const options = {};

  if (siteID) options.siteID = siteID;
  if (token)  options.token  = token;

  return Object.keys(options).length ? options : undefined;
}

function getActivityStore() {
  const { getStore } = require("@netlify/blobs");
  return getStore(ACTIVITY_STORE, buildStoreOptions());
}

function formatStoreError(error) {
  if (!error) return "Unknown storage error.";
  const message = error && error.message ? String(error.message) : String(error);
  return message.replace(/\s+/g, " ").trim();
}

module.exports = {
  getActivityStore,
  formatStoreError,
  ACTIVITY_STORE
};
