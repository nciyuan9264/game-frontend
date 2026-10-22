module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  ignorePatterns: ['showcase/', 'dist/', 'node_modules/', 'src/api/generated/'],
  plugins: ['@typescript-eslint', 'react-hooks'],
  overrides: [{
    files: ['src/features/acquire/**/*.{ts,tsx}'],
    rules: {
      ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  }],
};
