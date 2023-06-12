const { defineConfig } = require('cypress');
const webpackConfig = require('@vue/cli-service/webpack.config.js');
require('dotenv').config({
  path: './.env.cypress',
});

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8081',
    specPattern: 'tests/e2e/*.spec.js',
    supportFile: 'tests/support/index.js',
  },
  folders: {
    fixturesFolder: 'tests/fixtures',
    screenshotsFolder: 'tests/screenshots',
    videosFolder: 'tests/videos',
  },
  numTestsKeptInMemory: 1,
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
      webpackConfig,
    },
  },
  browser: {
    chromeWebSecurity: false,
    numTestsKeptInMemory: 1,
    experimentalMemoryManagement: true,
  },
  env: {
    appUrl: 'http://localhost:8081',
    apiUrl: 'http://localhost:8080',
    MAILOSAUR_API_KEY: process.env.MAILOSAUR_API_KEY,
    MAILOSAUR_SERVER_ID: process.env.MAILOSAUR_SERVER_ID,
  },
});
