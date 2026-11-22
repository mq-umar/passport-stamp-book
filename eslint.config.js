"use strict";
const js = require("@eslint/js");
const globals = require("globals");

// Browser scripts share globals through <script> tags; list them so no-undef stays useful.
const appGlobals = { Rules: "readonly", Art: "readonly", Store: "readonly", Views: "readonly", PERSONAS: "readonly" };

module.exports = [
  { ignores: ["node_modules/**", "docs/**"] },
  js.configs.recommended,
  { files: ["js/**/*.js"], languageOptions: { sourceType: "script", globals: { ...globals.browser, ...appGlobals, module: "readonly" } },
    rules: { "no-redeclare": ["error", { builtinGlobals: false }], "no-unused-vars": ["error", { vars: "local", caughtErrors: "none" }] } },
  { files: ["sw.js"], languageOptions: { sourceType: "script", globals: globals.serviceworker } },
  { files: ["server.js", "server.test.js", "eslint.config.js", "tests/unit/*.js"], languageOptions: { sourceType: "commonjs", globals: globals.node } },
  { files: ["tests/ui/*.mjs"], languageOptions: { sourceType: "module", globals: { ...globals.node, ...globals.browser } } },
];
