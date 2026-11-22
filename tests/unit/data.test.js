"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const PERSONAS = require("../../js/data");
const jsonPersonas = require("../../data.json");

test("js/data.js PERSONAS matches the server data.json copy", () => {
  assert.deepEqual(PERSONAS, jsonPersonas);
});

test("every persona has the required identity fields and valid transactions", () => {
  assert.ok(Object.keys(PERSONAS).length > 0, "expected at least one persona");

  for (const [personaKey, persona] of Object.entries(PERSONAS)) {
    for (const field of ["name", "holder", "role", "docNo"]) {
      assert.equal(typeof persona[field], "string", `${personaKey}.${field} should be a string`);
      assert.ok(persona[field].length > 0, `${personaKey}.${field} should not be empty`);
    }

    const ids = new Set();
    for (const [index, transaction] of persona.tx.entries()) {
      const label = `${personaKey}.tx[${index}]`;
      assert.ok(transaction.id !== undefined && transaction.id !== null, `${label} should have an id`);
      assert.ok(!ids.has(transaction.id), `${personaKey} transaction ids should be unique`);
      ids.add(transaction.id);

      assert.match(transaction.d, /^\d{4}-\d{2}-\d{2}$/, `${label}.d should use YYYY-MM-DD`);
      assert.equal(typeof transaction.m, "string", `${label}.m should be a string`);
      assert.equal(typeof transaction.city, "string", `${label}.city should be a string`);
      assert.equal(typeof transaction.st, "string", `${label}.st should be a string`);
      assert.equal(typeof transaction.cat, "string", `${label}.cat should be a string`);
      assert.equal(typeof transaction.amt, "number", `${label}.amt should be a number`);
      assert.ok(["posted", "pending"].includes(transaction.status), `${label}.status should be posted or pending`);
      assert.equal(typeof transaction.miles, "number", `${label}.miles should be a number`);
    }
  }
});
