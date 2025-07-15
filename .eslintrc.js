module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: {
    node: true,
    es2020: true,
    jest: true // For backend tests
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    // Add custom rules or override defaults here
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Adjust if you want explicit types for all functions
    '@typescript-eslint/no-unused-vars': ['warn', { "argsIgnorePattern": "^_" }], // Warns on unused vars, allows underscore prefix
    'prettier/prettier': 'error'
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json'
      }
    }
  }
};