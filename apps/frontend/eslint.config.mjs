import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pluginNext from '@next/eslint-plugin-next/dist/index.js';
import pluginJs from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginImport from 'eslint-plugin-import';
import pluginTailwindcss from 'eslint-plugin-tailwindcss';
import pluginSonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    ignores: [
      '**/*.test.{js,ts}',
      '**/*.spec.{js,ts}',
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'scripts/**',
      '_scripts/**',
      '_docs/**',
      '_logs/**',
      '_unused/**',
      '_configs/**',
      '*.config.{js,ts,mjs}',
      '.eslintcache',
      '.build-history.json',
      'tsconfig.tsbuildinfo',
      'next-env.d.ts',
    ],
  },
  pluginJs.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        NodeJS: true,
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      '@typescript-eslint': tsPlugin,
      '@next/next': pluginNext,
      import: pluginImport,
      tailwindcss: pluginTailwindcss,
      sonarjs: pluginSonarjs,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      ...pluginJs.configs.recommended.rules,

      // Core JavaScript rules
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      eqeqeq: ['error', 'always'],

      // Formatting rules
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      // Import rules
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: 'next', group: 'external', position: 'before' },
            { pattern: 'next/**', group: 'external', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],

      // TypeScript rules
      'no-unused-vars': 'off', // Disabled in favor of @typescript-eslint/no-unused-vars
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          args: 'none',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // React rules
      'react-hooks/rules-of-hooks': 'error',
      'react/self-closing-comp': ['error', { component: true, html: true }],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],

      // Tailwind
      'tailwindcss/no-custom-classname': 'off',
    },
  },
];
