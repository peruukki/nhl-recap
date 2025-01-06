// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('typescript-eslint').Config} */
export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
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
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
