import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/.expo/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/out/**',
      '**/generated/**',
      '**/android/**',
      '**/ios/**',
      '**/*.min.js',
      '**/*.d.ts',
    ],
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  eslintReact.configs['recommended-typescript'],

  eslintConfigPrettier,
]);
