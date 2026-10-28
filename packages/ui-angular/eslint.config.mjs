import openstuff from '@openstuff-dev/lint/eslint/angular';

export default [
  ...openstuff,
  {
    files: ['**/*.ts'],
    rules: {
      // button[os-button] keeps the native element; <os-callout> has no native one.
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'os', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'os', style: 'kebab-case' },
      ],
    },
  },
];
