// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['rollup.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  {
    files: ['**/service-worker.js'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['app/src/test/test-animations.ts'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
);
