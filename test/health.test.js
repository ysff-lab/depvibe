import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysSince, aliveVerdict, responsiveVerdict, median,
  computeMedianResponse, healthVerdict,
} from "../src/health.js";

test("daysSince: valid date", () => {
  const recent = new Date(Date.now() - 5 * 86400000).toISOString();
  assert.equal(daysSince(recent), 5);
});

test("daysSince: null/invalid", () => {
  assert.equal(daysSince(null), null);
  assert.equal(daysSince("not-a-date"), null);
});

test("aliveVerdict: active", () => {
  const v = aliveVerdict(30);
  assert.equal(v.status, "active");
});

test("aliveVerdict: maintenance", () => {
  const v = aliveVerdict(200);
  assert.equal(v.status, "maintenance");
});

test("aliveVerdict: stale", () => {
  const v = aliveVerdict(500);
  assert.equal(v.status, "stale");
});

test("aliveVerdict: dead", () => {
  const v = aliveVerdict(800);
  assert.equal(v.status, "dead");
});

test("aliveVerdict: null", () => {
  const v = aliveVerdict(null);
  assert.equal(v.status, "unknown");
});

test("responsiveVerdict: responsive", () => {
  const v = responsiveVerdict(7);
  assert.equal(v.status, "responsive");
});

test("responsiveVerdict: slow", () => {
  const v = responsiveVerdict(20);
  assert.equal(v.status, "slow");
});

test("responsiveVerdict: unresponsive", () => {
  const v = responsiveVerdict(45);
  assert.equal(v.status, "unresponsive");
});

test("responsiveVerdict: null", () => {
  const v = responsiveVerdict(null);
  assert.equal(v.status, "unknown");
});

test("median: odd count", () => {
  assert.equal(median([1, 3, 5]), 3);
});

test("median: even count", () => {
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test("median: empty", () => {
  assert.equal(median([]), null);
  assert.equal(median(null), null);
});

test("computeMedianResponse: with closed_at", () => {
  const issues = [
    { created_at: "2026-01-01T00:00:00Z", closed_at: "2026-01-03T00:00:00Z" },
    { created_at: "2026-01-05T00:00:00Z", closed_at: "2026-01-10T00:00:00Z" },
  ];
  const m = computeMedianResponse(issues);
  assert.ok(m !== null);
  assert.ok(m > 0);
});

test("computeMedianResponse: empty", () => {
  assert.equal(computeMedianResponse([]), null);
  assert.equal(computeMedianResponse(null), null);
});

test("healthVerdict: healthy", () => {
  const recent = new Date(Date.now() - 10 * 86400000).toISOString();
  const v = healthVerdict({ lastCommitDate: recent, issueResponseDays: 5, openIssues: 3, stars: 100 });
  assert.equal(v.overall, "healthy");
  assert.equal(v.alive.status, "active");
  assert.equal(v.responsive.status, "responsive");
});

test("healthVerdict: dead", () => {
  const old = new Date(Date.now() - 800 * 86400000).toISOString();
  const v = healthVerdict({ lastCommitDate: old });
  assert.equal(v.overall, "unhealthy");
  assert.equal(v.alive.status, "dead");
});

test("healthVerdict: null", () => {
  const v = healthVerdict(null);
  assert.equal(v.overall, "unhealthy");
});
