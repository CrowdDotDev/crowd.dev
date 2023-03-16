const fs = require('fs')
const webpack = require('webpack')
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const DeadCodePlugin = require('webpack-deadcode-plugin')
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const {
  ElementPlusResolver
} = require('unplugin-vue-components/resolvers')

const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      }),
      new webpack.DefinePlugin({
        'process.env.PACKAGE_VERSION': '"' + version + '"'
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled'
      }),
      new DeadCodePlugin({
        patterns: ['src/**/*.(js|jsx|css|vue)']
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
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
