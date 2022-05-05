module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    browser: true,
    es6: true,
    mocha: true,
  },
  globals: {
    process: false,
  },
  extends: ['airbnb-base', 'prettier'],
  overrides: [
    {
      files: 'animations.js',
      rules: {
        'no-param-reassign': 'off',
      },
    },
  ],
  rules: {
    'import/prefer-default-export': 'off',
    'no-console': 'warn',
    'no-nested-ternary': 'off',
    'no-unused-vars': 'warn',
    'no-restricted-exports': 'off',
    'no-restricted-globals': 'off',
    'no-use-before-define': 'off',
    semi: 'off',
  },
  settings: {
    'import/resolver': { node: { paths: ['.'] } },
  },
};
