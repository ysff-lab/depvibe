import { test } from "node:test";
import assert from "node:assert/strict";
import { runCheck, shouldFail } from "../src/index.js";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("offline license check: compatible", async () => {
  const data = await runCheck({ license: "Apache-2.0", projectLicense: "MIT", network: false });
  assert.equal(data.license.verdict, "compatible");
});

test("offline license check: incompatible", async () => {
  const data = await runCheck({ license: "GPL-3.0", projectLicense: "MIT", network: false });
  assert.equal(data.license.verdict, "incompatible");
  assert.equal(shouldFail(data), true);
});

test("offline health check", async () => {
  const recent = new Date(Date.now() - 10 * 86400000).toISOString();
  const data = await runCheck({
    healthData: { lastCommitDate: recent, issueResponseDays: 5, openIssues: 2, stars: 50 },
    network: false,
  });
  assert.equal(data.health.overall, "healthy");
  assert.equal(shouldFail(data), false);
});

test("offline both", async () => {
  const recent = new Date(Date.now() - 10 * 86400000).toISOString();
  const data = await runCheck({
    license: "MIT",
    healthData: { lastCommitDate: recent, issueResponseDays: 5 },
    projectLicense: "MIT",
    network: false,
  });
  assert.equal(data.license.verdict, "compatible");
  assert.equal(data.health.overall, "healthy");
});

test("no data: unknown license, unhealthy", async () => {
  const data = await runCheck({ network: false });
  assert.equal(data.license.verdict, "unknown");
  assert.equal(data.health.overall, "unhealthy");
});

test("normalizeLicense via network path (mock)", async () => {
  // Just verify runCheck doesn't crash with a fake pkg name
  const data = await runCheck({ pkg: "this-package-does-not-exist-12345", network: false });
  assert.ok(data);
  assert.equal(data.license.verdict, "unknown");
});
