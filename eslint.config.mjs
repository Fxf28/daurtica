import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  // Generated / non-source artifacts must never be linted.
  {
    ignores: [
      ".next/**",
      "public/sw.js",
      "public/workbox-*.js",
      "public/fallback-*.js",
      "drizzle/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // react-hooks v7 (via eslint-config-next 16) promotes compiler-era rules
      // to errors. Existing fetch-on-mount patterns in this codebase need a
      // dedicated refactor (deferred); keep them visible as warnings so the
      // Next 16 security migration is not blocked by lint.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
