import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLicense, normalizeLicense, licenseSummary } from "../src/license.js";

test("normalizeLicense: exact SPDX", () => {
  assert.equal(normalizeLicense("MIT"), "MIT");
  assert.equal(normalizeLicense("Apache-2.0"), "Apache-2.0");
  assert.equal(normalizeLicense("GPL-3.0"), "GPL-3.0");
});

test("normalizeLicense: aliases", () => {
  assert.equal(normalizeLicense("mit"), "MIT");
  assert.equal(normalizeLicense("MIT License"), "MIT");
  assert.equal(normalizeLicense("Apache 2.0"), "Apache-2.0");
  assert.equal(normalizeLicense("apache license 2.0"), "Apache-2.0");
  assert.equal(normalizeLicense("gpl-3"), "GPL-3.0");
  assert.equal(normalizeLicense("bsd"), "BSD-3-Clause");
  assert.equal(normalizeLicense("unlicense"), "Unlicense");
  assert.equal(normalizeLicense("cc0"), "CC0-1.0");
  assert.equal(normalizeLicense("bsl"), "BSL-1.1");
});

test("normalizeLicense: null/empty", () => {
  assert.equal(normalizeLicense(null), null);
  assert.equal(normalizeLicense(""), null);
  assert.equal(normalizeLicense("none"), null);
});

test("checkLicense: permissive compatible with MIT", () => {
  for (const lic of ["MIT", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Apache-2.0", "Unlicense", "CC0-1.0", "0BSD", "Zlib"]) {
    const r = checkLicense(lic, "MIT");
    assert.equal(r.verdict, "compatible", `${lic} should be compatible`);
  }
});

test("checkLicense: strong copyleft incompatible with MIT", () => {
  for (const lic of ["GPL-2.0", "GPL-3.0", "AGPL-3.0"]) {
    const r = checkLicense(lic, "MIT");
    assert.equal(r.verdict, "incompatible", `${lic} should be incompatible`);
  }
});

test("checkLicense: file-level copyleft conditional", () => {
  for (const lic of ["MPL-2.0", "LGPL-2.1", "LGPL-3.0", "EPL-2.0"]) {
    const r = checkLicense(lic, "MIT");
    assert.equal(r.verdict, "conditional", `${lic} should be conditional`);
  }
});

test("checkLicense: non-OSI incompatible", () => {
  for (const lic of ["BSL-1.1", "SSPL-1.0"]) {
    const r = checkLicense(lic, "MIT");
    assert.equal(r.verdict, "incompatible", `${lic} should be incompatible`);
  }
});

test("checkLicense: unknown", () => {
  const r = checkLicense("SomeRandomLicense", "MIT");
  assert.equal(r.verdict, "unknown");
});

test("checkLicense: null input", () => {
  const r = checkLicense(null, "MIT");
  assert.equal(r.verdict, "unknown");
});

test("checkLicense: GPL project depending on GPL", () => {
  const r = checkLicense("GPL-3.0", "GPL-3.0");
  assert.equal(r.verdict, "compatible");
});

test("checkLicense: CC-BY-SA incompatible with MIT", () => {
  const r = checkLicense("CC-BY-SA-4.0", "MIT");
  assert.equal(r.verdict, "incompatible");
});

test("licenseSummary", () => {
  const results = [
    { verdict: "compatible" },
    { verdict: "compatible" },
    { verdict: "incompatible" },
    { verdict: "conditional" },
  ];
  const s = licenseSummary(results);
  assert.equal(s.compatible, 2);
  assert.equal(s.incompatible, 1);
  assert.equal(s.conditional, 1);
  assert.equal(s.unknown, 0);
});
