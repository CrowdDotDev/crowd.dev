import { fileURLToPath, URL } from 'node:url';

import { defineConfig, splitVendorChunkPlugin } from 'vite';
import vue from '@vitejs/plugin-vue';

import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { visualizer } from 'rollup-plugin-visualizer';

import dns from 'dns';

dns.setDefaultResultOrder('verbatim');

export default defineConfig({
  define: {
    'import.meta.env': process.env,
  },
  envPrefix: 'VUE_APP',
  plugins: [
    vue(),
    splitVendorChunkPlugin(),
    Components({
      extensions: ['vue', 'md'],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],
      dts: 'components.d.ts',
    }),
    visualizer({
      template: 'treemap',
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'analyse.html',
    }),
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(
        new URL('./node_modules', import.meta.url),
      ),
    },
  },
  server: {
    proxy: {
      '/api': {
        target:
          process.env.BACKEND_URL
          || 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/system-status': {
        target: 'https://api.openstatus.dev/public/status/crowddev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/system-status/, ''),
      },
    },
    port: 8081,
    host: true,
  },
});
