import openstuff from '@openstuff-dev/lint/eslint/angular';

export default [
  ...openstuff,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'docs', style: 'kebab-case' },
      ],
    },
  },
];
