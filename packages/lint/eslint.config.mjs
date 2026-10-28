import config from '../../eslint.config.mjs';

export default [
  ...config,
  // Written to break the rules, for this package's own tests.
  { ignores: ['fixtures'] },
];
