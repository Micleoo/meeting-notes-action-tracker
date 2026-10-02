import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      ".next.previous/**",
      "node_modules/**",
      "node_modules.previous/**",
      "next-env.d.ts",
      "test-results/**",
      "playwright-report/**",
    ],
  },
];
export default config;
