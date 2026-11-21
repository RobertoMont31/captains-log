import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-plugin-prettier';
import promise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default [
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
      '**/*.config',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintReact.configs['recommended-typescript'],
  prettierConfig,

  // Root Eslint
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: rootDir,
      },
    },
  },

  // Mobile application
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './apps/mobile/tsconfig.json',
        tsconfigRootDir: rootDir,
      },
    },
  },

  {
    plugins: {
      js,
      perfectionist,
      prettier,
      promise,
      react,
      'react-hooks': reactHooks as never,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          selector: 'variable',
        },
        { format: ['camelCase', 'PascalCase'], selector: 'function' },
        {
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          selector: 'parameter',
        },
        {
          format: ['PascalCase'],
          prefix: ['I'],
          selector: 'interface',
        },
        { format: ['PascalCase'], selector: 'typeLike' },
        {
          format: ['PascalCase', 'UPPER_CASE'],
          selector: 'enumMember',
        },
        { format: null, selector: 'property' },
        { format: null, selector: 'import' },
        {
          format: null,
          modifiers: ['destructured'],
          selector: 'variable',
        },
        {
          filter: { match: true, regex: '^unstable_' },
          format: null,
          selector: 'variable',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'error',
      'no-var': 'error',
      'perfectionist/sort-objects': [
        'error',
        {
          ignoreCase: true,
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'prefer-const': 'error',
      'prettier/prettier': [
        'error',
        {
          arrowParens: 'always',
          bracketSpacing: true,
          printWidth: 80,
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'all',
        },
      ],
      'promise/prefer-await-to-then': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react/jsx-newline': ['error', { prevent: true }],
      'react/jsx-props-no-multi-spaces': 'error',
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          ignoreCase: true,
          reservedFirst: true,
          shorthandFirst: true,
        },
      ],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'unused-imports/no-unused-imports': 'error',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['eslint.config.mts', 'apps/mobile/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'warn',
        { checksVoidReturn: false },
      ],
    },
  },
];
