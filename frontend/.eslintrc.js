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
    indent: 'warn',
    'no-trailing-spaces': 'warn',
    'vue/no-unused-components': 'warn',
    'vue/html-indent': 'warn',
    'vue/html-self-closing': 'warn',
    'object-curly-spacing': 'warn',
    'vue/html-button-has-type': 'warn',
    'import/order': 'warn',
    'keyword-spacing': 'warn',
    'space-before-blocks': 'warn',
    quotes: 'warn',
    'no-unused-vars': 'warn',
    'no-multiple-empty-lines': 'warn',
    'vue/no-v-html': 'off',
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
        ],
      },
    },
  },
};
