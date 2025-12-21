import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pluginNext from "@next/eslint-plugin-next";
import pluginJs from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginImport from "eslint-plugin-import";
import pluginTailwindcss from "eslint-plugin-tailwindcss";
import pluginSonarjs from "eslint-plugin-sonarjs";
import pluginStylistic from "@stylistic/eslint-plugin-ts";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    ignores: [
      "**/*.test.{js,ts}",
      "**/*.spec.{js,ts}",
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "scripts/**",
      "_scripts/**",
      "_docs/**",
      "_logs/**",
      "_unused/**",
      "_configs/**",
      "*.config.{js,ts,mjs}",
      ".eslintcache",
      ".build-history.json",
      "tsconfig.tsbuildinfo",
      "next-env.d.ts"
    ]
  },
  pluginJs.configs.recommended,
  pluginNext.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        NodeJS: true
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname
      }
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "@typescript-eslint": tsPlugin,
      "@stylistic/ts": pluginStylistic,
      "@next/next": pluginNext,
      import: pluginImport,
      tailwindcss: pluginTailwindcss,
      sonarjs: pluginSonarjs
    },
    settings: {
      react: {
        version: "detect"
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"]
        }
      }
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,

      "no-var": "error",
      "prefer-const": "error",
      "no-duplicate-imports": "error",
      eqeqeq: ["error", "always"],
      "object-shorthand": ["error", "always"],
      "prefer-arrow-callback": ["error", { allowNamedFunctions: false }],
      "no-restricted-syntax": [
        "error",
        { selector: "FunctionDeclaration", message: "Use arrow functions instead." },
        { selector: "ForInStatement", message: "Use Object.keys/values/entries alternatives." },
        { selector: "ForOfStatement", message: "Use array iteration helpers instead." },
        { selector: "WhileStatement", message: "Prefer functional iteration." },
        { selector: "DoWhileStatement", message: "Prefer functional iteration." }
      ],

      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      quotes: ["error", "single", { avoidEscape: true }],
      semi: ["error", "always"],

      "sort-imports": ["error", {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ["none", "all", "multiple", "single"]
      }],
      "import/order": ["error", {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
        pathGroups: [
          { pattern: "react", group: "external", position: "before" },
          { pattern: "react-dom", group: "external", position: "before" },
          { pattern: "next", group: "external", position: "before" },
          { pattern: "next/**", group: "external", position: "before" },
          { pattern: "@/common/**", group: "internal", position: "before" }
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true }
      }],
      "import/consistent-type-specifier-style": ["error", "prefer-inline"],
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      "import/no-anonymous-default-export": "error",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
      "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true, allowTypedFunctionExpressions: true }],
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/return-await": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-readonly": "error",

      "@stylistic/ts/member-delimiter-style": ["error", {
        multiline: { delimiter: "semi", requireLast: true },
        singleline: { delimiter: "semi", requireLast: false }
      }],

      "react-hooks/rules-of-hooks": "error",
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      "react/self-closing-comp": ["error", { component: true, html: true }],
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
      "react/jsx-no-target-blank": ["error", { enforceDynamicLinks: "always" }],
      "react/function-component-definition": ["error", { namedComponents: "arrow-function", unnamedComponents: "arrow-function" }],

      "tailwindcss/no-custom-classname": "off",

      "sonarjs/no-duplicate-string": ["warn", { threshold: 3 }],
      "sonarjs/prefer-immediate-return": "warn"
    }
  }
];
