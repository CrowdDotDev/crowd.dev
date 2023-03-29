module.exports = {
  root: true,

  env: {
    node: true,
  },

  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/airbnb',
  ],

  parserOptions: {
    ecmaVersion: 2020,
  },

  rules: {
    'no-console':
      process.env.NODE_ENV === 'production'
        ? 'warn'
        : 'off',
    'no-debugger':
      process.env.NODE_ENV === 'production'
        ? 'warn'
        : 'off',
    semi: 'warn',
    'comma-dangle': 'warn',
    'vue/no-unused-components': 'warn',
    'vue/html-indent': 'warn',
    'vue/html-self-closing': 'warn',
    'object-curly-spacing': 'warn',
    'vue/no-v-html': 'off',
    'no-unused-vars': 'off',
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'vuejs-accessibility/mouse-events-have-key-events': 'off',
    'vuejs-accessibility/click-events-have-key-events': 'off',
    'func-names': 'off',
    'import/no-cycle': 'off',
    'vue/max-len': [
      'error',
      {
        code: 150,
        ignoreComments: true,
        ignoreUrls: true,
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
  settings: {
    'import/resolver': {
      alias: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        map: [
          ['@', './src'],
          ['@formbricks', './node_modules/@formbricks'],
        ],
      },
    },
  },
};
