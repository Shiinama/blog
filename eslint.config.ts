import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginImport from 'eslint-plugin-import'
import pluginUnusedImports from 'eslint-plugin-unused-imports'

import type { Linter } from 'eslint'

export default [
  { ignores: ['.next/**', '.open-next/**', '.wrangler/**', 'cloudflare-env.d.ts', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: { import: pluginImport, 'unused-imports': pluginUnusedImports },
    rules: {
      // `unused-imports` reports the same thing and can autofix unused imports.
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'object', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      // Locale-aware navigation lives in `@/i18n/navigation`.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'next/link', message: 'Import `Link` from `@/i18n/navigation`.' },
            {
              name: 'next/navigation',
              importNames: ['redirect', 'permanentRedirect', 'useRouter', 'usePathname'],
              message: 'Import from `@/i18n/navigation`.'
            }
          ]
        }
      ]
    }
  },
  eslintConfigPrettier
] satisfies Linter.Config[]
