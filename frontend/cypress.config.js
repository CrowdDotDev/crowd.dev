const { defineConfig } = require('cypress')
const webpackConfig = require('@vue/cli-service/webpack.config.js')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4000',
    specPattern: 'tests/**/*.spec.js',
    supportFile: 'tests/support/index.js'
  },
  folders: {
    fixturesFolder: 'tests/fixtures',
    screenshotsFolder: 'tests/screenshots',
    videosFolder: 'tests/videos'
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
      webpackConfig
    }
  },
  browser: {
    chromeWebSecurity: false
  },
  env: {
    apiUrl: 'http://localhost:3000'
  }
})
