import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { formatReport } from "../src/report.js";
import { checkLicense } from "../src/license.js";
import { healthVerdict } from "../src/health.js";

const ANSI = /\x1b\[/;
const bin = fileURLToPath(new URL("../bin/depvibe.js", import.meta.url));
const forceTty = fileURLToPath(new URL("./fixtures/force-tty.cjs", import.meta.url));

const origTTY = process.stdout.isTTY;
const origNoColor = process.env.NO_COLOR;

afterEach(() => {
  process.stdout.isTTY = origTTY;
  if (origNoColor === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = origNoColor;
});

function sample(extra = {}) {
  return {
    name: "pkg",
    version: "1.0.0",
    license: checkLicense("MIT", "MIT"),
    health: healthVerdict(null),
    errors: [],
    ...extra,
  };
}

test("formatReport: colors on a TTY by default", () => {
  process.stdout.isTTY = true;
  delete process.env.NO_COLOR;
  assert.match(formatReport(sample()), ANSI);
});

test("formatReport: no colors when not a TTY", () => {
  process.stdout.isTTY = false;
  delete process.env.NO_COLOR;
  assert.doesNotMatch(formatReport(sample()), ANSI);
});

test("formatReport: useColor false disables colors on a TTY", () => {
  process.stdout.isTTY = true;
  delete process.env.NO_COLOR;
  assert.doesNotMatch(formatReport(sample({ useColor: false })), ANSI);
});

test("formatReport: NO_COLOR env disables colors on a TTY", () => {
  process.stdout.isTTY = true;
  process.env.NO_COLOR = "1";
  assert.doesNotMatch(formatReport(sample()), ANSI);
});

test("formatReport: empty NO_COLOR is ignored", () => {
  process.stdout.isTTY = true;
  process.env.NO_COLOR = "";
  assert.match(formatReport(sample()), ANSI);
});

function runCli(args, env = {}) {
  const childEnv = { ...process.env, ...env };
  if (!("NO_COLOR" in env)) delete childEnv.NO_COLOR;
  return execFileSync(process.execPath, ["--require", forceTty, bin, ...args], {
    env: childEnv,
    encoding: "utf8",
  });
}

test("cli: colored output on a TTY by default", () => {
  assert.match(runCli(["check", "--license", "MIT"]), ANSI);
});

test("cli: --no-color disables colors", () => {
  const out = runCli(["check", "--license", "MIT", "--no-color"]);
  assert.doesNotMatch(out, ANSI);
  assert.match(out, /LICENSE/);
});

test("cli: NO_COLOR env disables colors", () => {
  const out = runCli(["check", "--license", "MIT"], { NO_COLOR: "1" });
  assert.doesNotMatch(out, ANSI);
  assert.match(out, /LICENSE/);
});
