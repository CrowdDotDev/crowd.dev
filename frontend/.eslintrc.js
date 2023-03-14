module.exports = {
  root: true,

  env: {
    node: true
  },

  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/prettier'
  ],

  parserOptions: {
    ecmaVersion: 2020
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
    'vue/no-v-html': 'off',
    'vue/no-unused-components': 'warn',
    'no-unused-vars': 'warn'
  }
}
