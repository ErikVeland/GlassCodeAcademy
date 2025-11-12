import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      indent: 'off',
      'linebreak-style': 'off',
      quotes: 'off',
      semi: 'off',
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  },
  // Apply Node/Jest globals and CommonJS to test files as well
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      indent: 'off',
      'linebreak-style': 'off',
      quotes: 'off',
      semi: 'off',
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  }
];