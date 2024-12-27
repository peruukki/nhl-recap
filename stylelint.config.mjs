// @ts-check

/** @type {import('stylelint').Config} */
export default {
  extends: 'stylelint-config-standard-scss',
  rules: {
    'alpha-value-notation': 'number',
    'at-rule-empty-line-before': null,
    'color-function-notation': 'legacy',
    'font-family-name-quotes': 'always-unless-keyword',
    'import-notation': 'url',
    'media-feature-range-notation': 'prefix',
    'rule-empty-line-before': null,
    'scss/dollar-variable-empty-line-before': null,
    'scss/operator-no-newline-after': null,
    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)[-a-z0-9]*$',
      { message: 'Expected class selector "%s" to be kebab-case' },
    ],
  },
};
