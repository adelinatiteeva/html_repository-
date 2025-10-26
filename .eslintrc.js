/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'next/typescript'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'react/jsx-key': 'off'
  }
};
