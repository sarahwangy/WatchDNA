import nextConfig from 'eslint-config-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const config = [
  // Next.js recommended rules (already in flat config format in v16)
  ...nextConfig,

  // TypeScript + Prettier rules for .ts/.tsx files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier formatting errors become ESLint errors
      'prettier/prettier': 'error',
      // Warn (not error) on unused variables and explicit `any`
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Turn off ESLint rules that conflict with Prettier (must be last)
  prettierConfig,
];

export default config;
