// Minimal recommended ESLint flat config — bootstrapped by AIRE for D1 (lint) + D6 (complexity).
// Recommended preset only; complexity capped at maxCyclomaticComplexity (12) from tests/.evals/config.json.
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "frontend/dist/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  {
    // Server / Node code (Route Handlers, DB layer, config, tests, tooling).
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: { react },
    rules: {
      complexity: ["error", 12],
      // Recognise identifiers used only inside JSX as "used" (so imports like Link/Markdown
      // are not flagged no-unused-vars). This is the single React rule the config needs.
      "react/jsx-uses-vars": "error",
    },
  },
];
