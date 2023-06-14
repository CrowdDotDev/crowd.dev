const { defineConfig } = require('cypress');
const webpackConfig = require('@vue/cli-service/webpack.config.js');
require('dotenv').config({
  path: './.env.cypress',
});

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://apptest-kube.crowd.dev',
    specPattern: 'tests/e2e/*.spec.js',
    supportFile: 'tests/support/index.js',
  },
  folders: {
    fixturesFolder: 'tests/fixtures',
    screenshotsFolder: 'tests/screenshots',
    videosFolder: 'tests/videos',
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
      webpackConfig,
    },
  },
  browser: {
    chromeWebSecurity: false,
  },
  env: {
    appUrl: 'https://apptest-kube.crowd.dev',
    apiUrl: 'https://apptest-kube.crowd.dev/api',
    MAILOSAUR_API_KEY: import.meta.env.MAILOSAUR_API_KEY,
    MAILOSAUR_SERVER_ID: import.meta.env.MAILOSAUR_SERVER_ID,
  },
});
