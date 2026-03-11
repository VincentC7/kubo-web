import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // Prettier intégré comme règle ESLint
      'prettier/prettier': 'warn',

      // Vue 3 — bonnes pratiques
      'vue/multi-word-component-names': 'off',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-order': [
        'error',
        { order: ['script', 'template', 'style'] },
      ],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/no-unused-vars': 'warn',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',

      // JS général
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Globals navigateur
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        // Vue macros (disponibles dans <script setup> sans import)
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
    },
  },
  {
    // Ignorer les fichiers générés / dépendances
    ignores: ['dist/**', 'node_modules/**', 'public/**', '*.config.js'],
  },
]


