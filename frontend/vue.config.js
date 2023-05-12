const fs = require('fs');
const webpack = require('webpack');

const AutoImport = require('unplugin-auto-import/webpack');
const Components = require('unplugin-vue-components/webpack');
const {
  ElementPlusResolver,
} = require('unplugin-vue-components/resolvers');

const DeadCodePlugin = require('webpack-deadcode-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const packageJson = fs.readFileSync('./package.json');
const version = JSON.parse(packageJson).version || 0;

module.exports = {
  configureWebpack: {
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      new webpack.DefinePlugin({
        'process.env.PACKAGE_VERSION': `"${version}"`,
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
      }),
      new DeadCodePlugin({
        patterns: ['src/**/*.(js|jsx|css|vue|ts|tsx)'],
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        ignoreOrder: true,
      }),
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      minimizer: [
        new CssMinimizerPlugin(),
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /^\.\/.s?css$/,
          use: [MiniCssExtractPlugin.loader, 'sass-loader'],
        },
      ],
    },
  },
  devServer: {
    port: 8081,
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    proxy: {
      '/api': {
        target:
          process.env.BACKEND_URL
          || 'http://localhost:8080',
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  transpileDependencies: [
    '@cubejs-client/core',
    '@cubejs-client/vue3',
  ],
};
