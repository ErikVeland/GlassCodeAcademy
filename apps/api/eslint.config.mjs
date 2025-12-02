import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  // JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (type-unaware)
  ...tseslint.configs.recommended,

  // Project-specific settings for TS files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Keep console allowed for server logging
      'no-console': 'off',
      // Use TS-aware unused vars and ignore underscore-prefixed args
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Allow any temporarily in migrating codebase; tighten later
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Tests and JS utility files
  {
    files: ['tests/**/*.js', '**/*.test.js', 'src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];