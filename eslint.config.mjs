import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "out/**"] },
  ...coreWebVitals,
  {
    rules: {
      // Pre-existing patterns: syncing state from props / browser APIs on mount.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
