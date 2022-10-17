const fs = require('fs')
const webpack = require('webpack')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PACKAGE_VERSION': '"' + version + '"'
      })
    ]
  },
  devServer: {
    port: 8081,
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws'
    },
    proxy: {
      '/api': {
        target:
          process.env.BACKEND_URL ||
          'http://localhost:8080',
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  transpileDependencies: [
    '@cubejs-client/core',
    '@cubejs-client/vue3'
  ]
}
