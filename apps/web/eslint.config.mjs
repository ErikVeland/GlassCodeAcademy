import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore backup and disabled files to reduce lint noise
  {
    ignores: [
      "**/*.bak.ts",
      "**/*.bak.tsx",
      "**/*.bak.js",
      "**/*.bak.jsx",
      "src/middleware.ts.disabled",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
